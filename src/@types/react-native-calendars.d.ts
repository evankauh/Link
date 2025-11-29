declare module 'react-native-calendars' {
  import * as React from 'react';
  import { StyleProp, ViewStyle, TextStyle } from 'react-native';

  export interface DateObject {
    dateString: string;
    day: number;
    month: number;
    year: number;
    timestamp: number;
  }

  export interface CalendarTheme {
    backgroundColor?: string;
    calendarBackground?: string;
    textSectionTitleColor?: string;
    selectedDayBackgroundColor?: string;
    selectedDayTextColor?: string;
    todayTextColor?: string;
    dayTextColor?: string;
    textDisabledColor?: string;
    dotColor?: string;
    selectedDotColor?: string;
    arrowColor?: string;
    monthTextColor?: string;
    indicatorColor?: string;
    textDayFontFamily?: string;
    textMonthFontFamily?: string;
    textDayHeaderFontFamily?: string;
    textDayFontWeight?: string;
    textMonthFontWeight?: string;
    textDayHeaderFontWeight?: string;
    textDayFontSize?: number;
    textMonthFontSize?: number;
    textDayHeaderFontSize?: number;
  }

  export interface CalendarProps {
    current?: string;
    initialDate?: string;
    markedDates?: Record<string, any>;
    markingType?: 'simple' | 'multi-dot' | 'period' | 'multi-period' | 'custom';
    onDayPress?: (day: DateObject) => void;
    onMonthChange?: (month: DateObject) => void;
    theme?: CalendarTheme;
    style?: StyleProp<ViewStyle>;
  }

  export class Calendar extends React.Component<CalendarProps> {}
}
