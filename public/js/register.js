const email=document.getElementById('email')
const password=document.getElementById('password')
const form=document.getElementById('form')
const msg=document.getElementById('msg')
form.addEventListener('submit', e=>{
    e.preventDefault()
    const req=new XMLHttpRequest()
    req.open('GET', `/user/register?email=${email.value}&pass=${password.value}`)
    req.onload=()=>{
        const res=req.responseText
        if(res=='Ok'){
            msg.innerText="Success"
            window.location='/login'
        }
        else msg.innerText=res
    }
    req.onerror=()=>{
        msg.innerText="Error"
    }
    msg.innerText="Wait.."
    req.send()
})