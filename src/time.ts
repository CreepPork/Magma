export default class Time {
    public static toEpoch(date: Date): number {
        return date.getTime();
    }

    public static epochToDate(epoch: number): Date {
        return new Date(epoch);
    }
}
