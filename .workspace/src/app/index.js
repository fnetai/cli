import { default as Engine } from "../default/index.js";

const createApp = ({ container }) => {
  return (props) => {
    const engine = new Engine();
    engine.run({ ...props, container }).catch((error) => {
      console.log(error.message);
    });
  };
};
export { createApp };
