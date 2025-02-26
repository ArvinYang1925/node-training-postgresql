function isUndefined(value) {
  return value === undefined;
}

function isNotValidString(value) {
  return typeof value !== "string" || value.trim().length === 0 || value === "";
}

function isNotValidInteger(value) {
  return typeof value !== "number" || value < 0 || value % 1 !== 0;
}

function isNotValidUUID(value) {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return !uuidRegex.test(value);
}

function isValidPassword(value) {
  const passwordPattern = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,16}/;
  return passwordPattern.test(value);
}

module.exports = {
  isUndefined,
  isNotValidString,
  isNotValidInteger,
  isNotValidUUID,
  isValidPassword,
};
