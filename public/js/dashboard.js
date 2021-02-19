const ubutton=document.getElementById('ubutton')
const msg=document.getElementById('msg')

ubutton.addEventListener('click', e=>{
    msg.innerText='Uploading...'
})

function download(id){
    window.location=`/download?id=${id}&sessid=${localStorage.getItem('rcloud/sessid')}`
}
function logout(){
    localStorage.removeItem('rcloud/sessid')
    msg.innerText='Logging out...'
    window.location='/login'
}
function deleteF(id){
    msg.innerText='Deleting...'
    const req=new XMLHttpRequest()
    req.open('GET', `/delete?id=${id}&sessid=${localStorage.getItem('rcloud/sessid')}`)
    req.onload=()=>{
        window.location=`/dashboard?sessid=${localStorage.getItem('rcloud/sessid')}`
        msg.innerText='Reloading...'
    }
    req.send()
}