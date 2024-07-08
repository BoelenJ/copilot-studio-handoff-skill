class UserResponse {
    
    choice: string;
    name: string;
    
    constructor(name?: string, choice?: string) {
        this.name = name;
        this.choice = choice;
    }
}

export { UserResponse };