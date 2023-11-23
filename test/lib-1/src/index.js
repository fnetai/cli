// import React from "react";

// import fs from "fs";

// export default ()=>{

//     console.log(fs);

//     return (
//         <div>HELLO WORLD</div>
//     )
// }

import { prompt, Confirm, AutoComplete, Survey } from 'enquirer';

export default async () => {

    // const response = await prompt([
    //     {
    //       type: 'input',
    //       name: 'name',
    //       message: 'What is your name?'
    //     },
    //     {
    //       type: 'input',
    //       name: 'username',
    //       message: 'What is your username?'
    //     }
    //   ]);

    //   const prompt = new Confirm({
    //     name: 'question',
    //     message: 'Did you like enquirer?'
    //   });      


    // const prompt = new AutoComplete({
    //     name: 'flavor',
    //     message: 'Pick your favorite flavor',
    //     limit: 10,
    //     initial: 2,
    //     choices: [
    //         'Almond',
    //         'Apple',
    //         'Banana',
    //         'Blackberry',
    //         'Blueberry',
    //         'Cherry',
    //         'Chocolate',
    //         'Cinnamon',
    //         'Coconut',
    //         'Cranberry',
    //         'Grape',
    //         'Nougat',
    //         'Orange',
    //         'Pear',
    //         'Pineapple',
    //         'Raspberry',
    //         'Strawberry',
    //         'Vanilla',
    //         'Watermelon',
    //         'Wintergreen'
    //     ]
    // });

    const prompt = new Survey({
        name: 'experience',
        message: 'Please rate your experience',
        scale: [
            { name: '1', message: 'Strongly Disagree' },
            { name: '2', message: 'Disagree' },
            { name: '3', message: 'Neutral' },
            { name: '4', message: 'Agree' },
            { name: '5', message: 'Strongly Agree' }
        ],
        margin: [0, 0, 2, 1],
        choices: [
            {
                name: 'interface',
                message: 'The website has a friendly interface.'
            },
            {
                name: 'navigation',
                message: 'The website is easy to navigate.'
            },
            {
                name: 'images',
                message: 'The website usually has good images.'
            },
            {
                name: 'upload',
                message: 'The website makes it easy to upload images.'
            },
            {
                name: 'colors',
                message: 'The website has a pleasing color palette.'
            }
        ]
    });

    const response = await prompt.run();

    console.log(response); // { name: 'Edward Chan', username: 'edwardmchan' }
}