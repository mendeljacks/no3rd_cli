import axios from 'axios'
import * as child_process from 'child_process'
import { prompt } from 'inquirer'
import { get_settings } from '../helpers/settings'
import pluralize from 'pluralize'
import * as fs from 'fs'

export type CreateParams = {
    none?: string[]
    inquirer?: string[]
    cli?: string[]
    external?: string[]
    with?: string
}

export const create_entity = async (entity: string, args: CreateParams) => {
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
    const fields = Object.entries(entity_schema.fields)

    const user_entities: any = await get_entities(entity, args, fields)

    const mutation = {
        meta: { operation: 'create' },
        [entity]: [user_entities]
    }
    console.log(JSON.stringify(mutation, null, 2))

    const answers = await prompt([
        {
            type: 'confirm',
            default: false,
            name: 'confirm',
            message: `Are you sure you would like to create 1 ${pluralize(entity, 1)}?`
        }
    ])
    if (!!answers.confirm) {
        await axios({
            url: base_url + '/mutate',
            headers: { Authorization: `Bearer ${token}` },
            data: mutation,
            method: 'post'
        }).catch(err => {
            console.error(err?.response?.data || err)
            return Promise.reject('Failed to create entity')
        })
    }
}

const inquire = async (fields: [string, any][]): Promise<Object> => {
    const questions = fields.map(([field_name, field_schema]: [string, any]) => {
        return {
            type: 'input',
            name: field_name,
            message: `${field_name}${field_schema?.required ? '*' : ''}`
        }
    })

    const answer = await prompt(questions)

    return answer
}

const external = async (entity, args, e_fields) => {
    if (e_fields.length === 0) {
        return {}
    }
    const e_response = await new Promise((resolve, reject) => {
        try {
            fs.writeFileSync(
                `./generated/${entity}.json`,
                e_fields.length > 1
                    ? `{
${e_fields
    .map(([field_name, field_schema]: [string, any]) => {
        return `    "${field_name}": null`
    })
    .join(',\n')}
}`
                    : ''
            )

            var child = child_process.spawn(args.with, [`./generated/${entity}.json`], {
                stdio: 'inherit'
            })

            child.on('exit', function (e, code) {
                console.log('finished', e, code)
                const raw = fs.readFileSync(`./generated/${entity}.json`, 'utf-8')
                fs.unlinkSync(`./generated/${entity}.json`)
                resolve(e_fields.length > 1 ? JSON.parse(raw) : { [e_fields[0][0]]: raw })
            })
        } catch (error) {
            reject(error)
        }
    })

    return e_response
}

const get_entities = async (entity, args: CreateParams, fields: [string, any][]) => {
    const n_fields = fields.filter(([field_name]) => args.none?.includes(field_name))
    const i_fields = fields.filter(([field_name]) => args.inquirer?.includes(field_name))
    const c_fields = fields.filter(([field_name]) => Object.keys(args.cli)?.includes(field_name))
    const e_fields = fields.filter(([field_name]) => args.external?.includes(field_name))

    const unspecified_fields = fields.filter(
        ([field_name]) =>
            ![...n_fields, ...i_fields, ...c_fields, ...e_fields]
                .map(([el]) => el)
                .includes(field_name)
    )

    const invalid_fields = Object.keys(args.cli).filter(
        provided_field => !fields.map(([field_name]) => field_name).includes(provided_field)
    )
    if (invalid_fields.length > 0) {
        throw new Error(
            'The following provided fields are invalid: ' + Object.keys(args.cli).join(', ')
        )
    }

    const i_response = await inquire([...i_fields, ...unspecified_fields])
    const c_response = args.cli
    const e_response: Object = await external(entity, args, e_fields)

    return {
        ...i_response,
        ...c_response,
        ...e_response
    }
}
