// import React from "react";

// import fs from "fs";

// export default ()=>{

//     console.log(fs);

//     return (
//         <div>HELLO WORLD</div>
//     )
// }

import { prompt } from 'enquirer';

export default async () => {
    const response = await prompt([
        {
          type: 'input',
          name: 'name',
          message: 'What is your name?'
        },
        {
          type: 'input',
          name: 'username',
          message: 'What is your username?'
        }
      ]);
      
      console.log(response); // { name: 'Edward Chan', username: 'edwardmchan' }
}