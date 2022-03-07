#! /usr/bin/env node
// @ts-ignore
import { Command } from 'commander'
import { create_entity, CreateParams as CreateParams } from './commands/create'
import { login } from './commands/login'
import { logout } from './commands/logout'
import { ReadParams, read_entity } from './commands/read'
const app = new Command()
app.command('logout').action(async () => {
    logout()
    console.log('Logged out')
})

app.command('login').action(async () => {
    const settings = await login()
    console.log(settings)
})

const split_n_trim = val => {
    return val.split(',').map(el => el.trim())
}
const parse = string => {
    try {
        const parsed = JSON.parse(string)
        return parsed
    } catch (error) {
        throw new Error('Could not parse cli args as json')
    }
}
app.command('create <entity>')
    .option('-n, --none <fields>', 'List fields to skip', split_n_trim)
    .option('-i, --inquirer <fields>', 'List fields for interactive prompt', split_n_trim)
    .option('-c, --cli <fields>', 'List fields to be prepopulated', parse)
    .option('-e, --external <fields>', 'List fields to be opened in external editor', split_n_trim)
    .option('-w, --with <editor>', 'Open with', 'vi')
    .action(async (entity: string, args: CreateParams) => {
        create_entity(entity, args)
    })

app.command('read')
    .option('-q, --query <query>', 'Json query', parse)
    .option('-i, --inline', 'Show results inline')
    .option('-e, --external', 'Show results in external editor')
    .option('-w, --with <editor>', 'Editor to open with', 'vi')
    .action(async (args: ReadParams) => {
        read_entity(args)
    })

app.parse(process.argv)
