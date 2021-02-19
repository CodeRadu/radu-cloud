const express=require('express')
const app=express()
const dotenv=require('dotenv')
const {readFileSync, writeFileSync, readFile, writeFile, unlink, existsSync}=require('fs')
const filter=require('filter-files')
const {v4:uuidV4}=require('uuid')
const path=require('path')
const fileUpload=require('express-fileupload')
dotenv.config({path: './config/conf.env'})
if(!existsSync('./data/users.json'))writeFileSync('./data/users.json', '{"users": {}, "sessid": []}')
if(!existsSync('./data/files.json'))writeFileSync('./data/files.json', '{"files":{}}')
let users={users: {}, sessid: []}
let files={files: {}}
users=JSON.parse(readFileSync('./data/users.json', 'utf8'))
users.sessid=[]
if(process.env.MODE=='production')writeFileSync('./data/users.json', JSON.stringify(users))
files=JSON.parse(readFileSync('./data/files.json', 'utf8'))

app.use(express.static('public'))
app.use(fileUpload({
    createParentPath: true
}))
app.set('view engine', 'ejs')

app.get('/', (req, res)=>{
    res.render('index')
})

app.get('/register', (req, res)=>{
    res.render('register')
})

app.get('/login', (req, res)=>{
    res.render('login')
})

app.get('/dashboard', (req, res)=>{
    const sessid=req.query.sessid
    const find=users.sessid.find(id=>id.sessid==sessid)
    if(!find){
        res.redirect('/login')
        return
    }
    const user=find.user
    if(sessid=="" || sessid==null){
        res.redirect('/login')
        return
    }
    const userFiles=files.files[user]
    res.render('dashboard', {folders: userFiles.folders, files: userFiles.files, sessid: sessid})
})

app.get('/user/register', async (req, res)=>{
    const email=req.query.email
    const pass=req.query.pass
    if(email==null || pass==null)res.status(403)
    else {
        if(users[email]==null){
            users.users[email]={
                pass: pass,
                files: email
            }
            files.files[email]={
                files: []
            }
            res.send('Ok')
            await writeFile('./data/files.json', JSON.stringify(files), ()=>{})
            await writeFile('./data/users.json', JSON.stringify(users), () => {})
        }
        else res.status(403).send('Email in use')
    }
})

app.get('/user/login', (req, res)=>{
    const email=req.query.email
    const pass=req.query.pass
    if(email==null || pass==null)res.status(403)
    else {
        if(users.users[email]==null || users.users[email].pass!=pass)res.status(403).send('Someting\'s wrong')
        else if(users.users[email].pass==pass){
            const sessid=uuidV4()
            users.sessid.push({sessid: sessid, user: email})
            res.send(sessid)
        }
    }
})

app.get('/user/check', (req, res)=>{
    const sessid=req.query.id
    const find=users.sessid.find(id=>id==sessid)
    if(find)res.send('ok')
    else res.send('error')
})

app.post('/upload', (req, res)=>{
    try {
        if(!req.files || !req.query.sessid){
            res.send('No file to upload')
        }
        else {
            let file=req.files.file
            const user=users.sessid.find(sess=>sess.sessid==req.query.sessid)
            const id=uuidV4()
            file.mv('./data/' + id + path.extname(file.name))
            files.files[user.user].files.push({
                name: file.name,
                id: id
            })
            res.redirect(`/dashboard?sessid=${req.query.sessid}`)
            writeFile('./data/files.json', JSON.stringify(files), ()=>{})
        }
    } catch (err) {
        console.log(err)
    }
})

app.get('/download', (req, res)=>{
    if(req.query.id){
        const file=filter.sync(`data`)
        const fil=file.find(str=>str.includes(req.query.id))
        res.sendFile(`${__dirname}/${fil}`)
    }
    else {
        res.redirect('/dashboard')
    }
})

app.get('/delete', (req, res)=>{
    if(req.query.sessid && req.query.id){
        const find=users.sessid.find(sess=>sess.sessid==req.query.sessid)
        if(find){
            const file=files.files[find.user].files.findIndex(filee=>filee.id==req.query.id)
            const id=file.id
            const fille=filter.sync(`data`)
            const fil=fille.find(str=>str.includes(req.query.id))
            unlink(fil, ()=>{})
            delete files.files[find.user].files[file]
            const filess=files.files[find.user].files.filter(x=>x!=null)
            files.files[find.user].files=filess
            writeFile('./data/files.json', JSON.stringify(files), ()=>{})
            res.send('ok')
        }
    }
})

app.listen(80, ()=>console.log(`Running in ${process.env.MODE} mode`))