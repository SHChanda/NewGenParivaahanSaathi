from __future__ import annotations

from datetime import date
from typing import Literal

from pydantic import BaseModel, Field, model_validator


class ChallengeRequest(BaseModel):
    locale: Literal["en", "hi"]


class MobileChallengeRequest(ChallengeRequest):
    mobileNumber: str = Field(pattern=r"^[0-9]{10}$")


class AadhaarChallengeRequest(ChallengeRequest):
    aadhaarNumber: str = Field(pattern=r"^[0-9]{12}$")


class VerifyMobileRequest(BaseModel):
    otp: str = Field(pattern=r"^[0-9]{6}$")
    consentToStatusUpdates: Literal[True]


class VerifyAadhaarRequest(BaseModel):
    otp: str = Field(pattern=r"^[0-9]{6}$")
    declarationsAccepted: list[Literal["identity_verification", "transaction_only", "confidentiality"]] = Field(min_length=3, max_length=3)

    @model_validator(mode="after")
    def all_declarations_are_present(self):
        if set(self.declarationsAccepted) != {"identity_verification", "transaction_only", "confidentiality"}:
            raise ValueError("Accept all declarations.")
        return self


class CreateApplicationRequest(BaseModel):
    applicationRoute: Literal["aadhaar", "non_aadhaar"]
    locale: Literal["en", "hi"]


class PersonName(BaseModel):
    firstName: str = Field(min_length=1, max_length=80)
    middleName: str | None = Field(default=None, max_length=80)
    lastName: str = Field(min_length=1, max_length=80)


class Address(BaseModel):
    state: str = Field(min_length=1)
    pinCode: str = Field(pattern=r"^[0-9]{6}$")


class PersonalDetails(BaseModel):
    applicantName: PersonName
    relativeType: Literal["father", "mother", "husband", "guardian"]
    relativeName: PersonName
    legalSex: Literal["female", "male", "non_binary", "prefer_not_to_say", "self_describe"]
    legalSexSelfDescription: str | None = Field(default=None, max_length=100)
    dateOfBirth: date
    bloodGroup: Literal["A_POSITIVE", "A_NEGATIVE", "B_POSITIVE", "B_NEGATIVE", "O_POSITIVE", "O_NEGATIVE", "AB_POSITIVE", "AB_NEGATIVE"]
    applicantPhoneNumber: str = Field(pattern=r"^[0-9]{10}$")
    emergencyPhoneNumber: str = Field(pattern=r"^[0-9]{10}$")
    identificationMarks: list[str] = Field(min_length=2, max_length=2)
    permanentAddress: Address
    presentAddressSameAsPermanent: bool
    presentAddress: Address | None = None
    declarationAccepted: Literal[True]

    @model_validator(mode="after")
    def validate_present_address(self):
        if self.legalSex == "self_describe" and not self.legalSexSelfDescription:
            raise ValueError("Provide a self-description.")
        if self.legalSex != "self_describe" and self.legalSexSelfDescription:
            raise ValueError("Self-description is only used when selected.")
        if not self.presentAddressSameAsPermanent and not self.presentAddress:
            raise ValueError("Enter the present address.")
        return self


class VehicleCategoryRequest(BaseModel):
    category: Literal["two_wheeler", "car", "commercial"]


class SignRequest(BaseModel):
    signatureId: str
    declarationAccepted: Literal[True]


class ApplicationIdRequest(BaseModel):
    applicationId: str


class TestAnswerRequest(BaseModel):
    questionId: str
    answerId: str