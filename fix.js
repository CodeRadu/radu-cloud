const {existsSync, readFileSync, writeFileSync}=require('fs')
if(existsSync('./data/files.json')){
    try {
        const files=JSON.parse(readFileSync('./data/files.json', 'utf8'))
        if(files.files==undefined){
            console.log('files.json is corrupted. Rebuilding..')
            writeFileSync('./data/files.json', '{"files":{}}')
        }
    } catch (err) {
        console.log('files.json is corrupted. Rebuilding..')
        writeFileSync('./data/files.json', '{"files":{}}')
    }
}
if(existsSync('./data/users.json')){
    try {
        const users=JSON.parse(readFileSync('./data/users.json', 'utf8'))
        users.sessid.forEach(e=>{})
        if(users.users==undefined || users.sessid==undefined){
            console.log('files.json is corrupted. Rebuilding..')
            writeFileSync('./data/users.json', '{"files":{}}')
        }
    } catch (err) {
        console.log('users.json is corrupted. Rebuilding..')
        writeFileSync('./data/users.json', '{"users": {}, "sessid": []}')
    }
}