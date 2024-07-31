import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

// función que transforma camel case en texto normal con mayúsculas
// ej nombreCompleto -> Nombre Completo 
// función que transforma camel case en texto normal con mayúsculas
// ej nombreCompleto -> Nombre Completo 
function camelCaseToNormal(str: string): string {
    return str
        .replace(/([A-Z])/g, ' $1')  // Inserta un espacio antes de cada mayúscula
        .replace(/^./, function(str){ return str.toUpperCase(); })  // Capitaliza la primera letra
        .trim();  // Elimina cualquier espacio inicial innecesario
}

function putTildes(str: string): string {
    switch (str) {
        case "Operacion":
            return "Operación"
        case "Conversacion":
            return "Conversación"
        default:
            return str
    }
}