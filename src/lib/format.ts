export function formatMoney(amount: number): string {
    const fractionDigits = Number.isInteger(amount) ? 0 : 2

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: 2,
    }).format(amount)
}