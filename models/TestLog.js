const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
  test_request_id: Number,
  technician_id: Number,
  environment: {
    temperature: String,
    humidity: String,
    atmospheric_pressure: String
  },
  cable_info: {
    family: String,
    cross_section: String,
    color: String
  },
  tests: [
    {
      test_name: String,
      standard: String,
      values: {
        value_1_min: Number,
        value_1_max: Number,
        value_2_min: Number,
        value_2_max: Number,
        value_3_min: Number,
        value_3_max: Number,
        average: Number,
        status: String
      }
    }
  ],
  comments: String,
  start_time: Date,
  end_time: Date
});

module.exports = mongoose.model('TestLog', testSchema);
