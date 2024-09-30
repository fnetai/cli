const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const nunjucks = require('nunjucks');
const Red = require('@node-red/util');

const fnetConfig = require('@fnet/config');

module.exports = async ({ atom, setInProgress, context, deploymentProject, deploymentProjectTarget: target, buildId,packageDependencies,njEnv }) => {

    await setInProgress({ message: "Deploying it as node-red flow." });
    
    const projectDir = context.projectDir;
    const templateDir = context.templateDir;

    const PREFIX=atom.type==='workflow'?'WF':'LIB';

    let tmpContext;

    if (target.deploy.template === 'simple') {
        tmpContext = {
            atom,
            packageDependencies: packageDependencies,
            red: {
                tab: {
                    id: target.deploy.id || Red.util.generateId(),
                    label: `${PREFIX}/${atom.id ? atom.id : os.hostname()}/${atom.name}/${target.deploy.name || target.deploy.template}`
                },
                function: {
                    id: Red.util.generateId(),
                    name: atom.doc.name,
                    initialize: {
                        content: fs.readFileSync(path.resolve(projectDir, 'dist/default/iife/index.js'), { encoding: 'utf8', flag: 'r' }),
                        var: atom.doc.bundleName
                    }
                },
                inject: {
                    id: Red.util.generateId(),
                    ...target.params?.inject,
                    payload: target.params?.inject?.payloadType === 'json' ? `'${JSON.stringify(target.params?.inject?.payload)}'` : target.params?.inject?.payload
                },
                debug: {
                    id: Red.util.generateId()
                }
            }
        }
    }
    else if (target.deploy.template === 'cronjob') {
        let schedulesCloned = target.params?.schedules ? cloneDeep(target.params?.schedules) : undefined;

        schedulesCloned?.forEach(schedule => {
            if (schedule.payloadType === 'json')
                schedule.payload = `'${JSON.stringify(schedule.payload)}'`;
        });

        tmpContext = {
            atom,
            packageDependencies: packageDependencies,
            red: {
                tab: {
                    id: target.deploy.id || Red.util.generateId(),
                    label: `${PREFIX}/${atom.id ? atom.id : os.hostname()}/${target.deploy.name || target.deploy.template}`
                },
                function: {
                    id: Red.util.generateId(),
                    name: atom.doc.name,
                    initialize: {
                        content: fs.readFileSync(path.resolve(projectDir, 'dist/default/iife/index.js'), { encoding: 'utf8', flag: 'r' }),
                        var: atom.doc.bundleName
                    }
                },
                cronjob: {
                    id: Red.util.generateId(),
                    schedules: schedulesCloned
                },
                debug: {
                    id: Red.util.generateId()
                }
            }
        }
    }
    else if (target.deploy.template === 'http') {
        tmpContext = {
            atom,
            packageDependencies: packageDependencies,
            red: {
                tab: {
                    id: target.deploy.id || Red.util.generateId(),
                    label: `${PREFIX}/${atom.id ? atom.id : os.hostname()}/${target.deploy.name || target.deploy.template}`
                },
                function: {
                    id: Red.util.generateId(),
                    name: atom.doc.name,
                    initialize: {
                        content: fs.readFileSync(path.resolve(projectDir, 'dist/default/iife/index.js'), { encoding: 'utf8', flag: 'r' }),
                        var: atom.doc.bundleName
                    }
                },
                httpin: {
                    id: Red.util.generateId(),
                    method: target.params.method || "get",
                    url: target.params.url
                },
                httpout: {
                    id: Red.util.generateId(),
                },
                debug: {
                    id: Red.util.generateId()
                }
            }
        }
    }

    else return;

    const template = nunjucks.compile(
        fs.readFileSync(path.resolve(templateDir, `deploy/node-red/${target.deploy.template}.yaml.njk`), "utf8"),
        njEnv
    );


    let templateRendered = template.render(tmpContext);
    fs.writeFileSync(path.resolve(projectDir, `node-red.yaml`), templateRendered);

    templateRendered = yaml.load(templateRendered);

    if (target.dryRun === true) return;

    deploymentProject.isDirty = true;

    const redConfig = (await fnetConfig({ name: context.redConfig || "red", dir: context.projectDir,tags:context.tags }))?.data;

    const redUrl = target.deploy.url || redConfig.env.RED_URL;
    
    const headers = {};
    if (target.deploy.auth !== false) {
        headers["Authorization"] = "Bearer " + atomAccessToken;
    }

    if (!target.deploy.id) {
        // create
        const response = await axios({
            method: "POST",
            url: `${redUrl}/flow`,
            data: templateRendered,
            headers
        });

        target.deploy.id = response.data.id;
    }
    else {
        if (target.actions?.delete === true) {
            // update
            const response = await axios({
                method: "DELETE",
                url: `${redUrl}/flow/${target.deploy.id}`,
                headers
            });
            delete target.actions.delete;
            delete target.deploy.id;
            target.enabled = false;
        }
        else {
            // update
            const response = await axios({
                method: "PUT",
                url: `${redUrl}/flow/${target.deploy.id}`,
                data: templateRendered,
                headers
            });
        }
    }
}