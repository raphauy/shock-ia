'use client'

import { useRef, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { File, Download, Upload, Loader } from 'lucide-react'
import { checkValidPhone } from '@/lib/utils'
import { useParams } from 'next/navigation'
import { saveCSVContactsAction } from './imported-contact-actions'
import { toast } from '@/hooks/use-toast'

export type ContactCSV = {
  nombre: string
  telefono: string
  estado?: string
  etiquetas?: string
}

type Props= {
  clientId: string
}

export function CSVImporter({ clientId }: Props) {
  const [contacts, setContacts] = useState<ContactCSV[]>([])
  const [isValid, setIsValid] = useState(false)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processCSV = async (csv: string) => {
    const lines = csv.split('\n')
    const headers = lines[0].toLowerCase().split(',')
    const parsedContacts: ContactCSV[] = []
    let isValidData = true

    for (let i = 1; i < lines.length; i++) {
      const currentLine = lines[i].split(',')
      if (currentLine.length === headers.length) {
        const contact: ContactCSV = {
          nombre: currentLine[headers.indexOf('nombre')],
          telefono: currentLine[headers.indexOf('telefono') !== -1 ? headers.indexOf('telefono') : headers.indexOf('teléfono')],
          estado: currentLine[headers.indexOf('estado')],
          etiquetas: currentLine[headers.indexOf('etiquetas')]
        }

        if (!await checkValidPhone(contact.telefono)) {
          isValidData = false
          console.error(`Número de teléfono inválido: ${contact.telefono}`)
        }

        parsedContacts.push(contact)
      }
    }

    setContacts(parsedContacts)
    setIsValid(isValidData)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const text = e.target?.result as string
        await processCSV(text)
      }
      reader.readAsText(file)
    }
  }

  const handleImport = async () => {
    setLoading(true)
    saveCSVContactsAction(clientId, contacts)
    .then(() => {
        toast({ title: "Contactos guardados para procesar" })
        // remove all contacts
        setContacts([])
        setIsValid(false)
        setOpen(false)
    })
      .catch((error) => {
        toast({ title: "Error al importar contactos", description: error.message, variant: "destructive" })
    })
    .finally(() => {
        setLoading(false)
    })
  }

  const downloadSampleCSV = () => {
    const sampleData = `nombre,teléfono,estado,etiquetas
Juan Pérez,+1234567890,Nuevo,cliente;vip
María García,+5491234567890,Inactivo,prospecto
Carlos Rodríguez,59899123456,Pendiente,nuevo;interesado`

    const blob = new Blob([sampleData], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.setAttribute('hidden', '')
    a.setAttribute('href', url)
    a.setAttribute('download', 'contactos_ejemplo.csv')
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setOpen(true)} className="w-52">
          <File className="w-4 h-4 mr-2" />
          Importar archivo CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Importar Contactos CSV</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                />
                <Button onClick={triggerFileInput} variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    {fileName ? `Archivo: ${fileName}` : 'Seleccionar CSV'}
                </Button>
                </div>
                <Button onClick={downloadSampleCSV} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Descargar ejemplo
                </Button>
            </div>
          {contacts.length > 0 && (
            <>
              <div>Total de registros: {contacts.length}</div>
              <div className={isValid ? "text-green-600" : "text-red-600"}>
                {isValid ? "Todos los registros son válidos" : "Hay registros con teléfonos inválidos"}
              </div>
              <ScrollArea className="h-[300px] w-full rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Etiquetas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contacts.map((contact, index) => (
                      <TableRow key={index}>
                        <TableCell>{contact.nombre}</TableCell>
                        <TableCell>{contact.telefono}</TableCell>
                        <TableCell>{contact.estado}</TableCell>
                        <TableCell>{contact.etiquetas}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
              <Button onClick={handleImport} disabled={!isValid || loading} className="gap-2">
                Importar Contactos
                {loading && <Loader className="w-4 h-4 ml-2 animate-spin" />}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

