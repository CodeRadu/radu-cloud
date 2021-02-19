const email=document.getElementById('email')
const password=document.getElementById('password')
const form=document.getElementById('form')
const msg=document.getElementById('msg')
form.addEventListener('submit', e=>{
    e.preventDefault()
    const req=new XMLHttpRequest()
    req.open('GET', `/user/login?email=${email.value}&pass=${password.value}`)
    req.onload=()=>{
        const sessid=req.responseText
        const res=req.responseText.split('-')
        if(res[0]!='Someting\'s wrong'){
            msg.innerText="Success"
            window.location=`/dashboard?sessid=${sessid}`
            localStorage.setItem('rcloud/sessid', sessid)
        }
        else msg.innerText=res
    }
    req.onerror=()=>{
        msg.innerText="Error"
    }
    msg.innerText="Wait.."
    req.send()
})