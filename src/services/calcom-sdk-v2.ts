import axios from 'axios'
import { config } from 'dotenv'
config()

const apiKey= process.env.CALCOM_API_KEY
const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
};

type Host = {
    userId: number,
    isFixed: boolean,
}

export type EventType = {
    hosts?: Host[],
    teamId?: number,
    length: number,
    metadata?: any,
    title: string,
    slug: string,
    scheduleId: number,
    minimumBookingNotice?: number,
    price?: number,
    currency?: string,
    slotInterval?: number,
    successRedirectUrl?: string,
    description?: string,
    locations?: Location[],
    seatsPerTimeSlot?: number,
    seatsShowAttendees?: boolean,
    seatsShowAvailabilityCount?: boolean,
    schedulingType?: string,
    assignAllTeamMembers?: boolean,
}

type Location = {
    address?: string,
    type: string,
    displayLocationPublicly?: boolean,
}

export type AvailabilitySlot = {
    start: string
    end: string
  }

export type Availability = {
    id?: number
    days: number[]
    startTime: string
    endTime: string
}

export type Schedule = {
    id: number
    name: string
    timeZone: string
    isDefault: boolean
    schedule: Availability[]
}

export async function me(){
    
    try {
        const url = `https://api.cal.com/v2/me`
        // use Bearer token
        const response = await axios.get(url, { headers: headers })
        
        const data = response.data
        
        if (response.status === 200) {
            return data
        } else {
            throw new Error('Error fetching me, code: ' + response.status);
        }        

    } catch (error) {
        console.error('Error fetching me', error);
        throw new Error('Error fetching me');
    }
}

export async function eventTypes(): Promise<EventType[]> {

    try {
        const url = `https://api.cal.com/api/v2/event-types`
        const response = await axios.get(url, { headers: headers });
        
        if (response.status === 200) {
            return response.data
        } else {
            throw new Error('Error fetching eventTypes, code: ' + response.status);
        }
    } catch (error) {
        console.error('Error fetching eventTypes', error);
        throw new Error('Error fetching eventTypes');
    }
}

export async function createEventType(data: EventType): Promise<number> {
    console.log(data)
    
    try {
        const url = `https://api.cal.com/api/v1/event-types?apiKey=${apiKey}`;
        const response = await axios.post(url, data);
        const dataRes = response.data;
        console.log('Response', dataRes);
        
        if (response.status === 200)
            return dataRes.event_type.id;
        else
            throw new Error('Error creating eventType');
    } catch (error) {
        console.error('Error fetching eventTypes', error);
        throw new Error('Error creating eventType');
    }
}

export async function assignAllTeamMembers(eventTypeId: number) {
    try {
        // const url = `https://api.cal.com/api/v1/event-types/${eventTypeId}?apiKey=${apiKey}`
        const url = `https://api.cal.com/api/v2/event-types/${eventTypeId}`
        const body = {
            title: "Pepe 2",
        }
        console.log("body", body)
        
       const response = await axios.patch(url, body, { headers: headers });
        // const response = await axios.patch(url, body);
        console.log("response", response)
        
        
        if (response.status === 200)
            return true;
        else
            throw new Error('Error assigning all team members');
    }
    catch (error) {
        console.error(JSON.stringify(error, null, 2));
        throw new Error('Error assigning all team members');
    }
}


export async function getSchedules() {
    try {
        const url = `https://api.cal.com/api/v2/schedules`
        const response = await axios.get(url, { headers: headers });
        
        if (response.status === 200) {
            return response.data
        } else {
            throw new Error('Error fetching schedules, code: ' + response.status);
        }
    } catch (error) {
        console.error('Error fetching schedules', error);
        throw new Error('Error fetching schedules');
    }
}

export async function getSchedule(scheduleId: number): Promise<Schedule> {
    try {
        const url = `https://api.cal.com/api/v2/schedules/${scheduleId}`
        const response = await axios.get(url, { headers: headers });
        
        if (response.status === 200) {
            return response.data.data
        } else {
            throw new Error('Error fetching schedule, code: ' + response.status);
        }
    } catch (error) {
        console.error('Error fetching schedule', error);
        throw new Error('Error fetching schedule');
    }
}

export async function createSchedule(name: string, timeZone: string): Promise<number> {
    try {
        const url = `https://api.cal.com/api/v2/schedules`
        const data = { name, timeZone, isDefault: false }
        const response = await axios.post(url, data, { headers: headers });

        const dataRes = response.data;
        
        if (response.status === 201)
            return dataRes.data.id;
        else
            throw new Error('Error creating schedule');
    } catch (error) {
        console.error('Error creating schedule', JSON.stringify(error, null, 2));
        throw new Error('Error creating schedule');
    }
}

export async function updateAvailabilities(scheduleId: number, availability: (AvailabilitySlot | null)[][]): Promise<boolean> {
    const schedule= await getSchedule(scheduleId)
    try {
        const url = `https://api.cal.com/api/v2/schedules/${scheduleId}`
        const body = {
            name: schedule.name,
            timeZone: schedule.timeZone,
            isDefault: schedule.isDefault,
            schedule: availability
        }
        console.log("body", body)
        
        const response = await axios.patch(url, body, { headers: headers });
        //console.log("response", response)
        
        
        if (response.status === 200)
            return true;
        else
            throw new Error('Error updating availabilities');
    }
    catch (error) {
        console.error('Error updating availabilities', JSON.stringify(error, null, 2));
        throw new Error('Error updating availabilities');
    }
}

export async function availableSlots(startTime: string, endTime: string, usernameList: string[])  {
    try {
        const url = `https://api.cal.com/api/v2/slots/available`
        const body = {
            startTime,
            endTime,
            usernameList: "[latidio]"
        }
        console.log("body", body)
        
        const response = await axios.get(url, { headers: headers, params: body });
        console.log("response")
        console.log(response)
        
        
        if (response.status === 200)
            return response.data.data;
        else
            throw new Error('Error getting available slots');
    }
    catch (error: any) {
        console.error('Error getting available slots');
        console.error(JSON.stringify(error.response.data, null, 2));
        //throw new Error('Error getting available slots');
    }
}

export async function createBooking() {
    try {
        const url = `https://api.cal.com/api/v1/bookings?apiKey=${apiKey}`
        const body = {
            eventTypeId: 1007605,
            start: "2024-08-27T12:00:00Z",
            responses: {
                name: "Rapha Test",
                email: "fabio@rapha.uy",
                guests: [],
                location: {
                    value: "inPerson",
                    optionValue: "",
                }
            },
            metadata: {},
            timeZone: "America/Montevideo",
            language: "es",
        }

        const response = await axios.post(url, body, { headers: headers });
        
        
        if (response.status === 200)
            return response.data;
        else
            throw new Error('Error creating booking');
    }
    catch (error: any) {
        console.error('Error creating booking');
        console.error(JSON.stringify(error.response.data, null, 2));
        //throw new Error('Error getting available slots');
    }
    
}