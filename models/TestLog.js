const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
  test_request_id: Number,
  technician_id: Number,
  environment: {
    temperature: String,
    humidity: String,
    pressure: String  // <-- importante: debe coincidir con el frontend
  },
  cable_info: {
    familia: String,
    calibre: String,
    color: String
  },
  tests: [
    {
      valores: [String],
      promedio: String,
      specs: String,
      status: String
    }
  ],
  comments: String,
  start_time: Date,
  end_time: Date
});

module.exports = mongoose.model('TestLog', testSchema);
