export default (args) => {
  const [condition, message] = Array.isArray(args) ? args : [args];
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
};
