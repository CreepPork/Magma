export default function sleep(msTimeout: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, msTimeout));
}
