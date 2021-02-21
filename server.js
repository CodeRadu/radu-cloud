const express=require('express')
const app=express()
const dotenv=require('dotenv')
const {readFileSync, writeFileSync, readFile, writeFile, unlink, existsSync, mkdirSync}=require('fs')
const filter=require('filter-files')
const {v4:uuidV4}=require('uuid')
const path=require('path')
const fileUpload=require('express-fileupload')
dotenv.config({path: './conf.env'})
const stripePublishableKey=process.env.STRIPE_PUBLISHABLE_KEY
const stripeSecretKey=process.env.STRIPE_SECRET_KEY
const stripe=require('stripe')(stripeSecretKey || '')
if(!existsSync('./data/users.json'))writeFileSync('./data/users.json', '{"users": {}, "sessid": []}')
if(!existsSync('./data/files.json'))writeFileSync('./data/files.json', '{"files":{}}')
if(!existsSync('./conf.env'))writeFileSync('./conf.env', 'MODE=production\nPORT=80\nSTRIPE=disabled\nSTRIPE_PUBLISHABLE_KEY=yourkeyhere\nSTRIPE_SECRET_KEY=yourkeyhere')
if(!existsSync('./data/uploads'))mkdirSync('./data/uploads')
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
app.use(express.json())
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

app.post('/purchase', (req, res)=>{
    const sessid=req.body.sessid
    const find=users.sessid.find(id=>id.sessid==sessid)
    if(!find){
        res.status(403).json({message: 'Payment failed. You were not charged'})
        return
    }
    const user=find.user
    stripe.charges.create({
        amount: 499,
        source: req.body.stripeTokenId,
        currency: 'usd'
    }).then(()=>{
        res.json({message: 'Success. Added 5 GB to your quota'})
        users.users[user].quota+=5
        writeFile('./data/users.json', JSON.stringify(users), ()=>{})
    }).catch(()=>{
        res.status(500).json({message: 'Payment failed. You were not charged'})
    })
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
    if(files.files[user]==undefined){
        files.files[user]={files: []}
        writeFile('./data/files.json', JSON.stringify(files), ()=>{})
    }
    const usedStorage=users.users[user].usedStorage
    const quota=users.users[user].quota
    const userFiles=files.files[user]
    res.render('dashboard', {files: userFiles.files, sessid, usedStorage, quota})
})

app.get('/user/register', async (req, res)=>{
    const email=req.query.email
    const pass=req.query.pass
    if(email==null || pass==null)res.status(403)
    else {
        if(users.users[email]==null){
            users.users[email]={
                pass: pass,
                files: email,
                quota: 5,
                usedStorage: 0
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
            const quota=users.users[user.user].quota
            const usedStorage=users.users[user.user].usedStorage
            if(usedStorage+file.size/1024/1024/1024<=quota){
                users.users[user.user].usedStorage+=file.size/1024/1024/1024
                file.mv('./data/uploads/' + id + path.extname(file.name))
                files.files[user.user].files.push({
                    name: file.name,
                    id: id,
                    size: file.size
                })
                res.redirect(`/dashboard?sessid=${req.query.sessid}`)
                writeFile('./data/files.json', JSON.stringify(files), ()=>{})
                writeFile('./data/users.json', JSON.stringify(users), ()=>{})
            }
            else res.send('This file exceeds your quota')
        }
    } catch (err) {
        console.log(err)
    }
})

app.get('/store', (req, res)=>{
    const sessid=req.query.sessid
    const find=users.sessid.find(id=>id.sessid==sessid)
    if(!find){
        res.redirect('/login')
        return
    }
    if(process.env.STRIPE==='enabled'){
        res.render('store', {sessid: sessid, publishableKey: process.env.STRIPE_PUBLISHABLE_KEY, sku: process.env.SKU})
    }
    else {
        res.send('Store is disabled on this website')
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
            const fille=filter.sync(`data/uploads`)
            const fil=fille.find(str=>str.includes(req.query.id))
            users.users[find.user].usedStorage-=files.files[find.user].files[file].size/1024/1024/1024
            unlink(fil, ()=>{})
            delete files.files[find.user].files[file]
            const filess=files.files[find.user].files.filter(x=>x!=null)
            files.files[find.user].files=filess
            writeFile('./data/files.json', JSON.stringify(files), ()=>{})
            writeFile('./data/users.json', JSON.stringify(users), ()=>{})
            res.send('ok')
        }
    }
})

app.listen(process.env.PORT || 80, ()=>console.log(`Running in ${process.env.MODE || 'production'} mode`))