"use strict";

module.exports = {
    EVENT_TYPES: {
        SEMINAR: { id: 1, code: 'SEMINAR', label: 'Seminar', icon: 'book-open', color: '#2196F3' },
        WORKSHOP: { id: 2, code: 'WORKSHOP', label: 'Workshop', icon: 'tools', color: '#4CAF50' },
        ASSEMBLY: { id: 3, code: 'ASSEMBLY', label: 'Assembly', icon: 'account-multiple', color: '#FF9800' },
        ORIENTATION: { id: 4, code: 'ORIENTATION', label: 'Orientation', icon: 'school', color: '#3F51B5' },
        MEETING: { id: 5, code: 'MEETING', label: 'Meeting', icon: 'meeting-room', color: '#607D8B' },
        GUEST_LECTURE: { id: 6, code: 'GUEST_LECTURE', label: 'Guest Lecture', icon: 'star', color: '#E91E63' },
        EXAMINATION: { id: 7, code: 'EXAMINATION', label: 'Examination', icon: 'file-document', color: '#795548' },
        OTHER: { id: 8, code: 'OTHER', label: 'Other', icon: 'circle', color: '#607D8B' }
    },

    BOOKING_STATUSES: {
        PENDING: { id: 1, code: 'PENDING', label: 'Pending', color: '#FFA500', isCancelable: true },
        CONFIRMED: { id: 2, code: 'CONFIRMED', label: 'Confirmed', color: '#4CAF50', isCancelable: true },
        IN_PROGRESS: { id: 3, code: 'IN_PROGRESS', label: 'In Progress', color: '#2196F3', isCancelable: false },
        COMPLETED: { id: 4, code: 'COMPLETED', label: 'Completed', color: '#9E9E9E', isCancelable: false },
        CANCELLED: { id: 5, code: 'CANCELLED', label: 'Cancelled', color: '#F44336', isCancelable: false },
        REJECTED: { id: 6, code: 'REJECTED', label: 'Rejected', color: '#9C27B0', isCancelable: false }
    },

    USER_TYPES: {
        STUDENT: { id: 1, code: 'STUDENT', label: 'Student' },
        FACULTY: { id: 2, code: 'FACULTY', label: 'Faculty' },
        STAFF: { id: 3, code: 'STAFF', label: 'Staff' },
        EXTERNAL: { id: 4, code: 'EXTERNAL', label: 'External User' }
    }
};