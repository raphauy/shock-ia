import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { camelCaseToNormal, putTildes } from "@/lib/utils";

type Props = {
    repoName: string
    jsonData: string
}

export default function DataCard({ repoName, jsonData }: Props) {
    const keys= Object.keys(JSON.parse(jsonData))
    return (
        <Card>
            <CardHeader>
                <CardTitle>{repoName}</CardTitle>
            </CardHeader>

            <CardContent>
                <div className="">
                    {
                        keys.map((key, i) => {
                            const value = JSON.parse(jsonData)[key];
                            const normalKey = camelCaseToNormal(key);
                            const keyWithTildes = putTildes(normalKey);
                            return (
                                <div key={i} className="grid grid-cols-2">
                                    <p className="whitespace-nowrap font-bold">{keyWithTildes}:</p>
                                    <p className="">{value}</p>
                                </div>
                            );
                        })
                    }
                </div>
            </CardContent>
        </Card>
    );
}

