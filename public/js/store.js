let stripe=Stripe(publishableKey)
async function startCheckout(){
    const {error}=await stripe.redirectToCheckout({
        items: [{sku, quantity: 1}],
        successUrl: 'http://localhost/success',
        cancelUrl: 'http://localhost/canceled'
    })
    if(error){
        alert('Something went wrong')
    }
}