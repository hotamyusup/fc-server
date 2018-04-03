const { createLogger, format, transports } = require('winston');

const { combine, timestamp, label, printf } = format;
const myFormat = printf((info) => {
  return `${info.timestamp} [${info.level}] : ${info.message}`;
});

require('winston-daily-rotate-file');

const transport = new transports.DailyRotateFile({
  dirname: 'log',
  filename: 'log',
  prepend: true,
  level: process.env.ENV === 'development' ? 'debug' : 'info',
});

const logger = createLogger({
  format: combine(timestamp(), myFormat),
  transports: [new transports.Console(), transport],
});

module.exports = logger;
