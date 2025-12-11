import * as dotenv from 'dotenv';
import * as path from 'path';

// Load the .env file from the project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });
