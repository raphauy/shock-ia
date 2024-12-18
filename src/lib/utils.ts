import { EventType } from "@prisma/client";
import { type ClassValue, clsx } from "clsx";
import { isThisWeek } from "date-fns";
import { isToday, isYesterday } from "date-fns";
import { parseISO } from "date-fns";
import { format, format as formatTZ, fromZonedTime, toDate, toZonedTime } from "date-fns-tz";
import { es } from "date-fns/locale";
import he from 'he';
import { twMerge } from "tailwind-merge";
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPresupuesto(presupuestoStr: string | undefined) {
  // in: 200000 USD, out: 200.000 USD
  // in: 200000, out: 200.000
  // in: 200000 UYU, out: 200.000 UYU

  if (!presupuestoStr) return ""

  const [presupuesto, moneda] = presupuestoStr.split(" ")
  // if presupuesto is not a number, return the original string
  if (isNaN(parseInt(presupuesto))) return presupuestoStr

  const presupuestoFormateado = parseInt(presupuesto).toLocaleString("es-UY")

  const monedaOut= moneda ? moneda : ""

  return `${presupuestoFormateado} ${monedaOut}`
}

export function removeSectionTexts(inputText: string): string {
  // Expresión regular que identifica el patrón, incluyendo saltos de línea
  // Uso de [\s\S]*? para coincidir con cualquier carácter incluyendo saltos de línea de forma no ávida
  // @ts-ignore
  const regex = /Text: ".*?",\n/gs;

  // Reemplazar las coincidencias encontradas por la cadena vacía
  const resultText = inputText.replace(regex, '');

  return resultText;
}
  

export function getFormat(date: Date): string {
  const timeZone = "America/Montevideo";
  
  // Convert the date to the desired time zone
  const zonedDate = toZonedTime(date, timeZone);
  
  const today = toZonedTime(new Date(), timeZone);

  if (
    zonedDate.getDate() === today.getDate() &&
    zonedDate.getMonth() === today.getMonth() &&
    zonedDate.getFullYear() === today.getFullYear()
  ) {
    return formatTZ(zonedDate, "HH:mm", { timeZone, locale: es });
  } else {
    return formatTZ(zonedDate, "yyyy/MM/dd", { timeZone, locale: es });
  }
}


export function formatCurrency(value: number): string {
  return Intl.NumberFormat("es-UY", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(value)  
}

export function decodeAndCorrectText(str: string): string {
    // Verifica si el input es undefined o null y devuelve una cadena vacía
  if (str === undefined || str === null) {
    return ''
  }

  // Primero, decodifica las entidades HTML
  let decodedStr: string = he.decode(str)

  // Corrige la codificación incorrecta de tildes y eñes
  const replacements: { [key: string]: string } = {
    'Ã¡': 'á', 'Ã©': 'é', 'Ã­': 'í', 'Ã³': 'ó', 'Ãº': 'ú',
    'Ã±': 'ñ', 'Ã': 'Á', 'Ã‰': 'É', 'Ã': 'Í', 'Ã“': 'Ó',
    'Ãš': 'Ú', 'Ã‘': 'Ñ',
    // los correctos
    'á': 'á', 'é': 'é', 'í': 'í', 'ó': 'ó', 'ú': 'ú', // Asegurar corrección si ya están correctos
    'Á': 'Á', 'É': 'É', 'Í': 'Í', 'Ó': 'Ó', 'Ú': 'Ú',
    'ñ': 'ñ', 'Ñ': 'Ñ'
  }

  Object.keys(replacements).forEach((key) => {
    const value: string = replacements[key];
    decodedStr = decodedStr.replace(new RegExp(key, 'g'), value);
  })

  // Manejar casos especiales como "cumplea{ tilde}os", "{ 'ia}"
  const specialReplacements: { [pattern: string]: string } = {
    '\\{ tilde\\}': 'ñ',
    '\\{ \'a\\}': 'á',
    '\\{ \'e\\}': 'é',
    '\\{ \'i\\}': 'í',
    '\\{ \'o\\}': 'ó',
    '\\{ \'u\\}': 'ú',
    '\\{ \'n\\}': 'ñ',
    // Versiones mayúsculas por si acaso también son necesarias
    '\\{ \'A\\}': 'Á',
    '\\{ \'E\\}': 'É',
    '\\{ \'I\\}': 'Í',
    '\\{ \'O\\}': 'Ó',
    '\\{ \'U\\}': 'Ú',
    '\\{ \'N\\}': 'Ñ',
  }

  Object.keys(specialReplacements).forEach((pattern) => {
    const replacement: string = specialReplacements[pattern];
    decodedStr = decodedStr.replace(new RegExp(pattern, 'g'), replacement);
  })

  const additionalReplacements: { [key: string]: string } = {
    'est�': 'está',
    'ma�ana': 'mañana',
    'a�o': 'año',
    'a�os': 'años',
    'cumplea�os': 'cumpleaños',    
    'Mart�n': 'Martín',
    'Malv�n': 'Malvín',
    'Juli�n': 'Julián',
    'Ger�nimo': 'Gerónimo',
    'Germ�n': 'Germán',
    'Gast�n': 'Gastón',
    'Est�vez': 'Estévez',
    'M�nimo': 'Mínimo',
    'M�ximo': 'Máximo',
    'M�nica': 'Mónica',
    'M�dico': 'Médico',
    'ni�os': 'niños',
    'Espa�a': 'España',
    'calefacci�o': 'calefacción',
  }
  
  Object.keys(additionalReplacements).forEach((key) => {
    const value: string = additionalReplacements[key];
    decodedStr = decodedStr.replace(new RegExp(key, 'g'), value);
  })

  // Luego, decodifica las secuencias de escape Unicode
  decodedStr = decodedStr.replace(/\\u([\dA-F]{4})/gi, (match, numStr) => {
    return String.fromCharCode(parseInt(numStr, 16));
  });

  return decodedStr;
}

export const colorPalette = [
  'rgb(53, 145, 118)',
  'rgb(48, 130, 106)',
  'rgb(58, 160, 130)',
  'rgb(43, 115, 94)',
  'rgb(63, 175, 142)',
  'rgb(38, 100, 82)',
  'rgb(68, 190, 154)',
  'rgb(33, 85, 70)',
  'rgb(73, 205, 166)',
  'rgb(23, 55, 46)',
];

// función que transforma camel case en texto normal con mayúsculas
// ej nombreCompleto -> Nombre Completo 
// función que transforma camel case en texto normal con mayúsculas
// ej nombreCompleto -> Nombre Completo 
export function camelCaseToNormal(str: string): string {
  return str
      .replace(/([A-Z])/g, ' $1')  // Inserta un espacio antes de cada mayúscula
      .replace(/^./, function(str){ return str.toUpperCase(); })  // Capitaliza la primera letra
      .trim();  // Elimina cualquier espacio inicial innecesario
}



export function putTildes(str: string): string {
  switch (str) {
      case "Operacion":
          return "Operación"
      case "Resumen Conversacion":
          return "Resumen Conversación"
      default:
          return str
  }
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase() // Convertir a minúsculas
    .normalize('NFD') // Descomponer los acentos y diacríticos
    .replace(/[\u0300-\u036f]/g, '') // Eliminar los diacríticos
    .replace(/\s+/g, '-') // Reemplazar espacios con guiones
    .replace(/[^\w\-]+/g, '') // Eliminar todos los caracteres que no sean palabras o guiones
    .replace(/\-\-+/g, '-') // Reemplazar múltiples guiones con uno solo
    .trim(); // Eliminar espacios al inicio y al final
}

export function getEventTypeLabel(option: EventType) {
  switch (option) {
    case EventType.SINGLE_SLOT:
      return "Repetitivo"
    case EventType.MULTIPLE_SLOTS:
      return "Evento de duración variable"
    case EventType.FIXED_DATE:
      return "Única vez"
    default:
      return "Evento"
  }
}

export function checkDateFormatForSlot(dateStr: string) {
  // formato YYYY-MM-DD
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  return regex.test(dateStr);
}

export function checkDateTimeFormatForSlot(dateStr: string) {
  // formato YYYY-MM-DD HH:mm
  const regex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;
  return regex.test(dateStr);
}

export function getStatusColorAndLabel(status: string) {
  if (status === 'open') {
    return "Conectado"
  } else if (status === 'close') {
    return "Desconectado"
  } else if (status === 'connecting') {
    return "Conectando"
  } else {
    return "Desconocido"
  }
}

export function getMonthName(month: string) {
  
  if (month.length === 7) month = (Number(month.slice(5, 7))).toString()
  if (month.length === 1) month = "0" + month

  switch (month) {
    case "01":
      return "enero"
    case "02":
      return "febrero"
    case "03":
      return "marzo"
    case "04":
      return "abril"
    case "05":
      return "mayo"
    case "06":
      return "junio"
    case "07":
      return "julio"
    case "08":
      return "agosto"
    case "09":
      return "septiembre"
    case "10":
      return "octubre"
    case "11":
      return "noviembre"
    case "12":
      return "diciembre"
    default:
      return "mes"
  }
}

export function formatWhatsAppStyle(date: Date | string): string {

  let parsedDate = typeof date === 'string' ? parseISO(date) : date;

  if (isToday(parsedDate)) {
    return format(parsedDate, 'HH:mm');
  } else if (isYesterday(parsedDate)) {
    return 'Ayer';
  } else if (isThisWeek(parsedDate)) {
    return format(parsedDate, 'eeee', { locale: es });
  } else {
    return format(parsedDate, 'dd/MM/yyyy');
  }
}

export function getDatesFromSearchParams(searchParams: { from: string, to: string, last: string }) {
  let from= null
  let to= null
  const last= searchParams.last
  const today= new Date()
  if (last === "HOY") {
      from= new Date(today.getFullYear(), today.getMonth(), today.getDate())
      to= new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
  } else if (last === "7D") {
      from= new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 7)
      to= new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
  } else if (last === "30D") {
      from= new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 30)
      to= new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
  } else if (last === "LAST_MONTH") {
      from= new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
      console.log("from: ", from)
      // the day should be the last day of the previous month
      const firstDayOfCurrentMonth= new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      // substract one day to get the last day of the previous month
      const lastDayOfPreviousMonth= new Date(firstDayOfCurrentMonth.getTime() - 24 * 60 * 60 * 1000)
      to= new Date(new Date().getFullYear(), new Date().getMonth() - 1, lastDayOfPreviousMonth.getDate())
      console.log("to: ", to)
  } else if (last === "ALL") {
      from= null
      to= null
  } else {
      from= searchParams.from ? new Date(searchParams.from) : null
      to= searchParams.to ? new Date(searchParams.to) : null
  }

  from= from ? fromZonedTime(from, "America/Montevideo") : null
  to= to ? fromZonedTime(to, "America/Montevideo") : null

  return { from, to }
}

export async function checkValidPhone(phone: string) {
  const expReg = /^(\+)?(598|54|1|56|55|52)?[0-9]{9,13}$/
  return expReg.test(phone)
}

