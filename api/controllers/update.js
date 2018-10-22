const mongoose = require('mongoose');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const moment = require('moment');
const Store = require('data-store');

/* DATA MODELS */
const Display = require('../models/display');
const Image = require('../models/image');
const Device = require('../models/device');
const Gateway = require('../models/gateway');

const store = new Store({ path: 'config.json' });
let waiting = false;

exports.update = async (req, res) => {
  try {
    const lastUpdate = store.get('lastUpdate');
    // Log last update
    console.log(`Last update was ${moment().diff(lastUpdate, 'seconds')} seconds ago`);
    // Array where all the found devices will be stored
    const devices = [];
    // Query based on authorization
    const query = !req.AuthData.admin
      ? { userGroup: req.AuthData.userGroup }
      : {};
    // If last update was made more than a minute ago
    if (waiting) {
      const error = {
        message: 'Waiting for another request to finish',
        status: 500,
      };
      throw error;
    } else if (moment().diff(lastUpdate, 'seconds') > 5) {
      // Set waiting flag to true
      waiting = true;
      // Log
      console.log('Updating...');
      // Get all gateways sync url stored in the database
      const gateways = await Gateway.find().select('id sync').exec();
      const sync = gateways.map(g => g.sync);
      // Map the sync urls to http responses with axios
      const requests = sync.map(async url => axios.get(url, { timeout: process.env.TIMEOUT }));
      // Perform all the requests and wait for them to end
      const responses = await axios.all(requests).catch(error => console.log(error.message));
      // If there are no responses set error message
      if (responses === undefined) {
        const error = {
          message: 'None of the gateways was reachable.',
          status: 400,
        };
        throw error;
      }
      // Map responses so they contain the ip, port and list of devices for each gateway
      const mappedResponses = responses.map(response => ({
        sync: response.config.url,
        devices: response.data.device,
      }));
      console.log(JSON.stringify(mappedResponses, null, ' '));
      // Set all devices to "not found"
      await Device.updateMany({}, { found: false }).exec();
      // Fill the devices array avoiding duplicates and selecting devices with better signal level
      for (let i = 0; i < mappedResponses.length; i++) { // for the first devices list
        // Get the full gateway object which found this devices
        const gateway = gateways.find(g => g.sync === mappedResponses[i].sync);
        // for each device within the list
        for (let j = 0; j < mappedResponses[i].devices.length; j++) {
          // save the device into a variable
          const currentDevice = mappedResponses[i].devices[j];
          // Check if the device has already been found
          const duplicate = devices.find(d => d.device.mac === currentDevice.mac);
          if (!duplicate) { // If it hasn't been found
            // Add two new properties
            currentDevice.found = true;
            currentDevice.gateway = gateway._id;
            currentDevice.lastFound = moment();
            // Push to found devices array
            devices.push({ device: currentDevice });
          } else if (Number(duplicate.device.rssi) < Number(currentDevice.rssi)) {
            // get the index of the device stored in found devices
            const duplicateIndex = devices.findIndex(d => d.device.mac === currentDevice.mac);
            // Add two new properties
            currentDevice.found = true;
            currentDevice.gateway = gateway._id;
            // Replace the device in the devices array
            devices.splice(duplicateIndex, 1, { device: currentDevice });
          }
        }
      }
      // If there are no devices return with an error
      if (devices.length === 0) {
        const error = {
          message: 'None of the gateways found any device.',
          status: 400,
        };
        throw error;
      }
      // Else update the API resources with new devices
      const updateOps = devices.map(d => ({
        updateOne: {
          filter: {
            // search for the device to update filtering by mac address
            mac: d.device.mac,
          },
          // update the device with the new device data coming from the gateways
          update: d.device,
          // if it's the first time this device has been found, create a new device resource
          upsert: true,
        },
      }));
      // Perform a bulkwrite operation and wait for it to finish
      await Device.bulkWrite(updateOps);
      // set lastUpdate to now
      store.set('lastUpdate', moment());
      console.log('Data store updated to:');
      console.log(store.data);
    }
    // Get the devices back from the database
    const updatedDevices = await Device.find(query).select('_id url name description mac found lastFound batt rssi initcode screen gateway createdAt updatedAt').populate('gateway', '_id name description mac url').exec();
    // Map devices for the responses
    updatedDevices.map((d) => {
      const device = d;
      // set the doc url manually for those devices that were added automatically and for which we couldnt know the id at that moment
      device.url = `${process.env.API_URL}devices/${device._id}`;
      return device;
    });
    // unblock
    waiting = false;
    // Send response with the devices
    res.status(200).json(updatedDevices);
  } catch (error) {
    // unblock
    waiting = false;
    // log and return errors
    console.log(error.message);
    res.status(error.status || 401).json({ error });
  }
};


exports.update_image = async (req, res) => {
  // get id for the display
  const _id = req.params.id;
  // get device and image information from the display resource
  try {
    const display = await Display.findById(_id).select('device activeImage');
    console.log(`Display found with id: ${display._id}`);
    const image = await Image.findById(mongoose.Types.ObjectId(display.activeImage)).select('path');
    console.log(`Image found with id: ${image._id}`);
    console.log(`The file's path is: ${image.path}`);
    const device = await Device.findById(mongoose.Types.ObjectId(display.device)).select('gateway mac').populate('gateway', 'sync');
    console.log(`The device to which this display is linked has the id: ${display.device}`);
    console.log(`This device has this mac: ${device.mac}`);
    console.log(`The url for uploading the image is: ${device.gateway.sync}/?mac=${device.mac}`);
    const file = fs.readFileSync(image.path);
    const form = new FormData();
    form.append('image', file, 'image.bmp');
    const config = {
      params: {
        mac: device.mac,
      },
      headers: form.getHeaders(),
      timeout: 30000,
    };
    await axios.put(device.gateway.sync, form, config);
    res.status(200).json({
      message: 'Imagen enviada a la pantalla con éxito',
    });
  } catch (e) {
    const error = {
      message: 'An error has ocurred while uploading the image to the display',
      error: e,
    };
    console.log(error);
    res.status(500).json({ error });
  }
};
