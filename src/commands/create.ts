import axios from 'axios'
import * as child_process from 'child_process'
import { prompt } from 'inquirer'
import { get_settings } from '../helpers/settings'
import * as fs from 'fs'

export const create_entity = async (entity: string, args: { external?: string }) => {
    const { token, base_url } = get_settings()
    if (!token) {
        console.error('Not logged in')
        return
    }

    const response = await axios({
        url: base_url + '/schema',
        method: 'get'
    })
    const entities = response.data.entities
    if (!entities[entity]) {
        console.error(`Entity ${entity} not found`)
        return
    }

    const entity_schema = entities[entity]
    const fields = Object.entries(entity_schema.fields).filter(
        ([field_name, field_schema]: [string, any]) => {
            return !['id', 'created_at', 'updated_at', 'resource_id'].includes(field_name)
        }
    )

    const user_entities: any = await get_entities(entity, args, fields)

    const mutation = {
        meta: { operation: 'create' },
        [entity]: user_entities
    }
    console.log(JSON.stringify(mutation, null, 2))

    const answers = await prompt([
        {
            type: 'confirm',
            name: 'confirm',
            message: `Are you sure you would like to create ${mutation[entity].length} ${entity}?`
        }
    ])
    if (!!answers.confirm) {
        return console.log('alright!')
    }
}

const get_entities = async (entity, args, fields) => {
    const inquirer_mode = !args.external
    if (inquirer_mode) {
        const questions = fields.map(([field_name, field_schema]: [string, any]) => {
            return {
                type: 'input',
                name: field_name,
                message: `${field_name}${field_schema?.required ? '*' : ''}`
            }
        })

        const answers = await prompt(questions)
        return [answers]
    }

    if (!!args.external) {
        const user_entities = await new Promise((resolve, reject) => {
            try {
                fs.writeFileSync(
                    `./generated/${entity}.json`,
                    `[{
${fields
    .map(([field_name, field_schema]: [string, any]) => {
        return `    "${field_name}": null`
    })
    .join(',\n')}
}]`
                )

                var child = child_process.spawn(args.external, [`./generated/${entity}.json`], {
                    stdio: 'inherit'
                })

                child.on('exit', function (e, code) {
                    console.log('finished', e, code)
                    const raw = fs.readFileSync(`./generated/${entity}.json`, 'utf-8')
                    fs.unlinkSync(`./generated/${entity}.json`)
                    resolve(JSON.parse(raw))
                })
            } catch (error) {
                reject(error)
            }
        })

        return user_entities
    }
}
