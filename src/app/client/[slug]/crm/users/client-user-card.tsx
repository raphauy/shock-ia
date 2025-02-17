import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { UserDAO } from "@/services/user-service"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { CheckCircle2, Mail, User } from "lucide-react"
import { ClientUserDialog, DeleteClientUserDialog } from "./client-user-dialogs"

type Props = {
    user: UserDAO
}

export default function UserCard({ user }: Props) {

    return (
        <Card className="w-full max-w-lg">
            <CardHeader className="flex flex-row justify-between space-y-0 pb-2">
                <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold text-lg">{user.name}</h3>
                </div>
            </CardHeader>
            <CardContent className="py-2">
                <div className="flex items-center space-x-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">{user.email}</span>
                </div>
            </CardContent>
            <CardFooter className="pt-2 flex justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <div><CheckCircle2 className="h-4 w-4" /></div>
                    <span className="text-sm">
                        {user.emailVerified ? 
                            `Verificado ${formatDistanceToNow(new Date(user.emailVerified), { addSuffix: true, locale: es })}` :
                            `No verificado`
                        }
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <ClientUserDialog
                        id={user.id} 
                        clientId={user.clientId}
                    />
                    <DeleteClientUserDialog
                        id={user.id} 
                        description={`¿Estás seguro que deseas eliminar al usuario ${user.name}?`}
                    />
                </div>
            </CardFooter>
        </Card>
    )
}