export function secondsDifference(date1: Date, date2: Date): number {
    // Convert both dates to milliseconds and find the difference
    const differenceInMilliseconds: number = Math.abs(date1.getTime() - date2.getTime());

    // Convert milliseconds to seconds
    const differenceInSeconds: number = differenceInMilliseconds / 1000;

    return differenceInSeconds;
}
