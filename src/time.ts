export default class Time {
    public static toEpoch(date: Date): number {
        return Math.trunc(date.getTime()) / 1000;
    }

    public static epochToDate(epoch: number): Date {
        return new Date(epoch * 1000);
    }
}
