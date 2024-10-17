import { camelCaseToNormal, cn, putTildes } from "@/lib/utils";

type Props = {
    jsonData: Record<string, any>
}

export default function BookingDataCard({ jsonData }: Props) {
    const keys = Object.keys(jsonData)
    return (
        <div className="px-4 flex gap-4">
            <div className="flex flex-col gap-2 border-l flex-1 pl-2">
                {keys.map((key, i) => {
                    const normalKey = camelCaseToNormal(key);
                    const keyWithTildes = putTildes(normalKey);
                    const value = jsonData[key];
                    if (!value) return null;
                    return (
                        <div key={i} className="flex gap-2">
                            <p className="text-muted-foreground w-44">{keyWithTildes}:</p>
                            <p className="break-words font-bold">{value}</p>
                        </div>
                    );
                })}
            </div>
            {/* <div className="flex flex-col items-start">
                {keys.map((key, i) => (
                    <p key={i} className={cn("break-words font-bold")}>{jsonData[key]}</p>
                ))}
            </div> */}
        </div>
    );
}

