/**
 * Reexports do domínio central para facilitar a evolução do core sem acoplar
 * componentes e serviços a caminhos espalhados.
 */
export type { Appointment, AppointmentService } from '../../types/appointment';
export type { AppointmentRequest } from '../../types/appointmentRequest';
export type { BotProfile } from '../../types/botProfile';
export type { Contact } from '../../types/contact';
export type { InboundEvent } from '../../types/inboundEvent';
export type { IntegrationEvent } from '../../types/integrationEvent';
export type { IntegrationLog } from '../../types/integrationLog';
export type { Project } from '../../types/project';
export type { ProjectConnection } from '../../types/projectConnection';
export type { Service } from '../../types/service';
export type { BotSession } from '../../types/botSession';
export type { ServiceRequest } from '../../types/serviceRequest';
