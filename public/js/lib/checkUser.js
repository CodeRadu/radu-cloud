export function check(sessid, callback){
    const req=new XMLHttpRequest()
    req.open('GET', `/user/check?id=${sessid}`)
    req.onload=()=>{
        if(req.responseText=='ok')callback(true)
        else callback(false)
    }
    req.send()
}