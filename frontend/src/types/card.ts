export interface ApplicantCard{
    idNumber: string,
    fullName: string,
    course: string,
    guardianName: string,
    photo: string | null;
    signature: string| null;
}