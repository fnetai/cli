export default (delay) => {
  return new Promise(function (resolve) {
    setTimeout(resolve, delay);
  });
};
