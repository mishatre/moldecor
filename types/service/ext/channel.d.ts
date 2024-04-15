export type ChanneltOptions = Partial<Exclude<any, 'handler'>> & {
    name: string;
};
export declare function Channel(options?: ChanneltOptions): MethodDecorator;
