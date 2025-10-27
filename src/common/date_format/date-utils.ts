// src/utils/date-format.service.ts
import { Injectable } from '@nestjs/common';
import { format } from 'date-fns';
import { OrganizationalProfile } from 'src/organizational-profile/entity/organizational-profile.entity';
import { DataSource, Repository } from 'typeorm';
import { exit } from 'process';
import ms from 'ms';

@Injectable()
export class DateFormatService {
  constructor(
    private readonly dataSource: DataSource,
  ) { }

  async formatDateDynamic(date: Date | string): Promise<string> {
    if (!date) {
      throw new Error('Date is null or undefined');
    }
    const organizationProfile = await this.dataSource.getRepository(OrganizationalProfile)
      .createQueryBuilder('organizational_profile')
      .getOne();

    console.log('ssssssssss', organizationProfile?.dateformat);

    if (!organizationProfile) {
      throw new Error('Organization profile not found.');
    }

    const dateformat = organizationProfile.dateformat || 'dd/MM/yyyy';

    const parsedDate = typeof date === 'string' ? new Date(date) : date;

    console.log(parsedDate); // Check how the date is parsed

    // Check the parsed date
    if (isNaN(parsedDate.getTime())) {
      throw new Error('Invalid date provided');
    }


    console.log(dateformat); // Check the date format
    console.log(parsedDate); // Check the date format

    // Return the formatted date
    return format(parsedDate, dateformat);
  }


  async convertToPgInterval(input: string): Promise<string> {
    if (!input) return '00:00:00';
    const durationMs = ms(input); // 15 min → 900000
    const totalSeconds = Math.floor(durationMs / 1000);
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`; // e.g., '00:15:00'
  }

  formatPgInterval(pgInterval: any): { hours: number; minutes: number } {
    if (!pgInterval) return { hours: 0, minutes: 0 };

    // If it's a string (like '01:30:00'), parse it
    if (typeof pgInterval === 'string') {
      const [hours, minutes] = pgInterval.split(':').map(Number);
      return { hours, minutes };
    }

    // If it's an object like { hours: 1, minutes: 30, seconds: 0 }
    const hours = pgInterval.hours || 0;
    const minutes = pgInterval.minutes || 0;

    return { hours, minutes };
  }

  formatIntervalToText(interval: any): string {
    const { hours, minutes } = this.formatPgInterval(interval);
    const parts = [];
    if (hours > 0) parts.push(`${hours} hr${hours > 1 ? 's' : ''}`);
    if (minutes > 0) parts.push(`${minutes} min${minutes > 1 ? 's' : ''}`);
    return parts.length ? parts.join(' ') : '0 mins';
  }

  
  formatTimeString(time: string | Date): string {
    if (!time) return '-';
    const date = new Date(time);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }); // → "12:45 PM"
  }

  calculateNetWorkingHours(startTime: Date, endTime: Date): any {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
  
    const durationMs = end - start; // Total working time in milliseconds
  
    const totalMinutes = Math.floor(durationMs / 60000); // Convert milliseconds to minutes
    const hours = Math.floor(totalMinutes / 60); // Extract hours
    const minutes = totalMinutes % 60; // Extract remaining minutes
  
    return {
      totalWorkingMinutes: totalMinutes, // Total minutes worked
      totalWorkingTime: [
        hours ? `${hours} hr${hours > 1 ? 's' : ''}` : '', // Handle hours
        minutes ? `${minutes} min${minutes > 1 ? 's' : ''}` : '', // Handle minutes
      ]
        .filter(Boolean)
        .join(' ') || '0 mins', // Join hours and minutes, or fallback to '0 mins'
    };
  }
  
  
  convertPgIntervalToMilliseconds(interval: any): number {
    const hours = interval?.hours || 0;
    const minutes = interval?.minutes || 0;
    const seconds = interval?.seconds || 0;
    return (hours * 3600 + minutes * 60 + seconds) * 1000;
  }
  
  
}
