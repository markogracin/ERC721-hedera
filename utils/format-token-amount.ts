export function formatTokenAmount(rawAmount: string): string {
    try {
        // Convert the raw amount (string) to BigInt for safe handling of large numbers
        const amount = BigInt(rawAmount);

        // Define our decimals (10^18) as BigInt to maintain precision
        const decimals = BigInt(10 ** 18);

        // Divide the amount by 10^18 to get the main number
        const wholeNumber = amount / decimals;

        // Get remainder to see if we have any decimal places
        const remainder = amount % decimals;

        // If we have no remainder, just return the whole number
        if (remainder === BigInt(0)) {
            return `${wholeNumber} BIDI`;
        }

        // If we have a remainder, format it properly
        const decimalPart = remainder.toString().padStart(18, '0');
        // Remove trailing zeros from decimal part
        const trimmedDecimal = decimalPart.replace(/0+$/, '');

        // Only show decimal part if it exists after trimming
        return trimmedDecimal ? `${wholeNumber}.${trimmedDecimal} BIDI` : `${wholeNumber} BIDI`;
    } catch (error) {
        console.error('Error formatting token amount:', error);
        return `${rawAmount} BIDI (raw)`;
    }
}
