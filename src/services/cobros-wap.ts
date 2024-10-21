import axios from 'axios'

export async function createExternalPayment( amount: number, currency: string, companyId: string, concept: string ): Promise<string | null> {
  try {
    const response = await axios.post('https://cobros-wap.vercel.app/api/banking/createExternalPayment', {
      amount,
      currency,
      companyId,
      concept,
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (response && response.data) {
      const { data } = response
      if (data.paymentLink && data.paymentLink.url) {
        return data.paymentLink.url
      } else {
        console.error('Payment link not found in response data:', data)
        return null
      }
    } else {
      console.error('No response data:', response)
      return null
    }
  } catch (error: any) {
    console.error('Error creating payment:', error)
    // log only status
    console.log(error.message)
    return null
  }
}
