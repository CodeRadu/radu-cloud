let stripeHandler=StripeCheckout.configure({
    key: publishableKey,
    locale: 'en',
    token: (token)=>{
        fetch('/purchase', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                stripeTokenId: token.id,
                sessid: localStorage.getItem('rcloud/sessid')
            })
        }).then(res=>{
            return res.json()
        }).then(data=>{
            alert(data.message)
        }).catch(err=>{
            console.error(err)
        })
    }
})
function purchase(){
    stripeHandler.open({
        amount: 499
    })
}