import 'react-day-picker';
import { ComponentProps } from 'react';

declare module 'react-day-picker' {
  export interface DayPickerProps extends ComponentProps<any> {}
  
  export function DayPicker(props: DayPickerProps): JSX.Element;
} 