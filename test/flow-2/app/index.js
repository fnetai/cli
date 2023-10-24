export default ({ container, Workflow }) => {

    const render = (props) => {
        const workflow = new Workflow();
        workflow.run({ ...props, container }).then((result) => {
            console.log(result);
        }).catch((error) => {
            console.log(error.message)
        });
    }

    return { render };
}