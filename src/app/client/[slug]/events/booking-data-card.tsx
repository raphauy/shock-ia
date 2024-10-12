import { camelCaseToNormal, cn, putTildes } from "@/lib/utils";

type Props = {
    jsonData: Record<string, any>
}

export default function BookingDataCard({ jsonData }: Props) {
    const keys = Object.keys(jsonData)
    return (
        <div className="px-4 flex gap-4">
            <div className="flex flex-col">
                {keys.map((key, i) => {
                    const normalKey = camelCaseToNormal(key);
                    const keyWithTildes = putTildes(normalKey);
                    const value = jsonData[key];
                    if (!value) return null;
                    return (
                        <p key={i} className="whitespace-nowrap text-muted-foreground">{keyWithTildes}:</p>
                    );
                })}
            </div>
            <div className="flex flex-col items-start">
                {keys.map((key, i) => (
                    <p key={i} className={cn("break-words font-bold")}>{jsonData[key]}</p>
                ))}
            </div>
        </div>
    );
}

