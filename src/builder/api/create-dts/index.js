import fnetShellJs from '@fnet/shelljs';
import which from '../../which.js';

export default async function createDts({ atom, setProgress, context }) {

    if(!atom.doc.features.dts_enabled) return;
    
    const projectDir = context.projectDir;

    await setProgress({ message: "Creating .d.ts" });

    const result = await fnetShellJs(`tsc`, { cwd: projectDir });
    if (result.code !== 0) throw new Error('Couldnt create .d.ts files.');  

    // if(which('bun')) {
    //   const result = await fnetShellJs(`bunx tsc`, { cwd: projectDir });
    //   if (result.code !== 0) throw new Error('Couldnt create .d.ts files.');  
    // }
    // else{
    //   const result = await fnetShellJs(`npx tsc`, { cwd: projectDir });
    //   if (result.code !== 0) throw new Error('Couldnt create .d.ts files.');  
    // }
}