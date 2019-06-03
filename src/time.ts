export default class Time {
    public static epochToDate(epoch: number): Date {
        return new Date(epoch * 1000);
    }
}
