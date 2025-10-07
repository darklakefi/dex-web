import type { Message } from "@bufbuild/protobuf";
import type {
  GenEnum,
  GenFile,
  GenMessage,
  GenService,
} from "@bufbuild/protobuf/codegenv2";
import {
  enumDesc,
  fileDesc,
  messageDesc,
  serviceDesc,
} from "@bufbuild/protobuf/codegenv2";
import { file_validate_validate } from "./validate/validate_pb";
export const file_api: GenFile = fileDesc(
  "CglhcGkucHJvdG8SC2RhcmtsYWtlLnYxImIKDVRva2VuTWV0YWRhdGESDAoEbmFtZRgBIAEoCRIOCgZzeW1ib2wYAiABKAkSEAoIZGVjaW1hbHMYAyABKA0SEAoIbG9nb191cmkYBCABKAkSDwoHYWRkcmVzcxgFIAEoCSLHAgoFVHJhZGUSEAoIdHJhZGVfaWQYASABKAkSEAoIb3JkZXJfaWQYAiABKAkSFAoMdXNlcl9hZGRyZXNzGAMgASgJEisKB3Rva2VuX3gYBCABKAsyGi5kYXJrbGFrZS52MS5Ub2tlbk1ldGFkYXRhEisKB3Rva2VuX3kYBSABKAsyGi5kYXJrbGFrZS52MS5Ub2tlbk1ldGFkYXRhEhEKCWFtb3VudF9pbhgGIAEoBBIaChJtaW5pbWFsX2Ftb3VudF9vdXQYByABKAQSKAoGc3RhdHVzGAggASgOMhguZGFya2xha2UudjEuVHJhZGVTdGF0dXMSEQoJc2lnbmF0dXJlGAkgASgJEhIKCmNyZWF0ZWRfYXQYCiABKAMSEgoKdXBkYXRlZF9hdBgLIAEoAxIWCg5pc19zd2FwX3hfdG9feRgMIAEoCCKkAQoMUXVvdGVSZXF1ZXN0Ei8KDHRva2VuX21pbnRfeBgBIAEoCUIZ+kIWchQQARgsMg5eW0EtWmEtejAtOV0rJBIvCgx0b2tlbl9taW50X3kYAiABKAlCGfpCFnIUEAEYLDIOXltBLVphLXowLTldKyQSGgoJYW1vdW50X2luGAMgASgEQgf6QgQyAiAAEhYKDmlzX3N3YXBfeF90b195GAQgASgIIp8BCg1RdW90ZVJlc3BvbnNlEhQKDHRva2VuX21pbnRfeBgBIAEoCRIUCgx0b2tlbl9taW50X3kYAiABKAkSFgoOaXNfc3dhcF94X3RvX3kYAyABKAgSEQoJYW1vdW50X2luGAQgASgEEhIKCmFtb3VudF9vdXQYBSABKAQSEgoKZmVlX2Ftb3VudBgGIAEoBBIPCgdmZWVfcGN0GAcgASgBIuACCiBDcmVhdGVVbnNpZ25lZFRyYW5zYWN0aW9uUmVxdWVzdBIvCgx1c2VyX2FkZHJlc3MYASABKAlCGfpCFnIUEAEYLDIOXltBLVphLXowLTldKyQSLwoMdG9rZW5fbWludF94GAIgASgJQhn6QhZyFBABGCwyDl5bQS1aYS16MC05XSskEi8KDHRva2VuX21pbnRfeRgDIAEoCUIZ+kIWchQQARgsMg5eW0EtWmEtejAtOV0rJBIaCglhbW91bnRfaW4YBCABKARCB/pCBDICIAASGAoHbWluX291dBgFIAEoBEIH+kIEMgIgABIfCgt0cmFja2luZ19pZBgGIAEoCUIK+kIHcgUQARj6ARIWCg5pc19zd2FwX3hfdG9feRgHIAEoCBIQCghyZWZfY29kZRgIIAEoCRIoCgVsYWJlbBgJIAEoCUIZ+kIWchQYCjIQXltBLVphLXowLTlfLV0qJCJ3CiFDcmVhdGVVbnNpZ25lZFRyYW5zYWN0aW9uUmVzcG9uc2USHAoUdW5zaWduZWRfdHJhbnNhY3Rpb24YASABKAkSEAoIb3JkZXJfaWQYAiABKAkSEAoIdHJhZGVfaWQYAyABKAkSEAoIcmVmX2NvZGUYBCABKAkiqAEKHFNlbmRTaWduZWRUcmFuc2FjdGlvblJlcXVlc3QSOAoSc2lnbmVkX3RyYW5zYWN0aW9uGAEgASgJQhz6QhlyFxABMhNeW0EtWmEtejAtOSsvPV8tXSokEh8KC3RyYWNraW5nX2lkGAIgASgJQgr6QgdyBRABGPoBEi0KCHRyYWRlX2lkGAMgASgJQhv6QhhyFhABGPoBMg9eW0EtWmEtejAtOV9dKiQiVgodU2VuZFNpZ25lZFRyYW5zYWN0aW9uUmVzcG9uc2USDwoHc3VjY2VzcxgBIAEoCBIQCgh0cmFkZV9pZBgCIAEoCRISCgplcnJvcl9sb2dzGAMgAygJImkKF0NoZWNrVHJhZGVTdGF0dXNSZXF1ZXN0Eh8KC3RyYWNraW5nX2lkGAEgASgJQgr6QgdyBRABGPoBEi0KCHRyYWRlX2lkGAIgASgJQhv6QhhyFhABGPoBMg9eW0EtWmEtejAtOV9dKiQiVgoYQ2hlY2tUcmFkZVN0YXR1c1Jlc3BvbnNlEhAKCHRyYWRlX2lkGAEgASgJEigKBnN0YXR1cxgCIAEoDjIYLmRhcmtsYWtlLnYxLlRyYWRlU3RhdHVzInUKGkdldFRyYWRlc0xpc3RCeVVzZXJSZXF1ZXN0Ei8KDHVzZXJfYWRkcmVzcxgBIAEoCUIZ+kIWchQQARgsMg5eW0EtWmEtejAtOV0rJBIRCglwYWdlX3NpemUYAiABKAUSEwoLcGFnZV9udW1iZXIYAyABKAUibAobR2V0VHJhZGVzTGlzdEJ5VXNlclJlc3BvbnNlEiIKBnRyYWRlcxgBIAMoCzISLmRhcmtsYWtlLnYxLlRyYWRlEhMKC3RvdGFsX3BhZ2VzGAIgASgFEhQKDGN1cnJlbnRfcGFnZRgDIAEoBSLBAQoXR2V0VG9rZW5NZXRhZGF0YVJlcXVlc3QSMgoNdG9rZW5fYWRkcmVzcxgBIAEoCUIZ+kIWchQQARgsMg5eW0EtWmEtejAtOV0rJEgAEiIKDHRva2VuX3N5bWJvbBgCIAEoCUIK+kIHcgUQARj6AUgAEiAKCnRva2VuX25hbWUYAyABKAlCCvpCB3IFEAEY+gFIABIfCglzdWJzdHJpbmcYBCABKAlCCvpCB3IFEAEY+gFIAEILCglzZWFyY2hfYnkiTgoYR2V0VG9rZW5NZXRhZGF0YVJlc3BvbnNlEjIKDnRva2VuX21ldGFkYXRhGAEgASgLMhouZGFya2xha2UudjEuVG9rZW5NZXRhZGF0YSJPChJUb2tlbkFkZHJlc3Nlc0xpc3QSOQoPdG9rZW5fYWRkcmVzc2VzGAEgAygJQiD6Qh2SARoIASIWchQQARgsMg5eW0EtWmEtejAtOV0rJCI8ChBUb2tlblN5bWJvbHNMaXN0EigKDXRva2VuX3N5bWJvbHMYASADKAlCEfpCDpIBCwgBIgdyBRABGPoBIjgKDlRva2VuTmFtZXNMaXN0EiYKC3Rva2VuX25hbWVzGAEgAygJQhH6Qg6SAQsIASIHcgUQARj6ASKYAgobR2V0VG9rZW5NZXRhZGF0YUxpc3RSZXF1ZXN0EjkKDmFkZHJlc3Nlc19saXN0GAEgASgLMh8uZGFya2xha2UudjEuVG9rZW5BZGRyZXNzZXNMaXN0SAASNQoMc3ltYm9sc19saXN0GAIgASgLMh0uZGFya2xha2UudjEuVG9rZW5TeW1ib2xzTGlzdEgAEjEKCm5hbWVzX2xpc3QYAyABKAsyGy5kYXJrbGFrZS52MS5Ub2tlbk5hbWVzTGlzdEgAEh8KCXN1YnN0cmluZxgGIAEoCUIK+kIHcgUQARj6AUgAEhEKCXBhZ2Vfc2l6ZRgEIAEoBRITCgtwYWdlX251bWJlchgFIAEoBUILCglmaWx0ZXJfYnkidQocR2V0VG9rZW5NZXRhZGF0YUxpc3RSZXNwb25zZRIqCgZ0b2tlbnMYASADKAsyGi5kYXJrbGFrZS52MS5Ub2tlbk1ldGFkYXRhEhMKC3RvdGFsX3BhZ2VzGAIgASgFEhQKDGN1cnJlbnRfcGFnZRgDIAEoBSK1AQoYQ3JlYXRlQ3VzdG9tVG9rZW5SZXF1ZXN0EhgKBG5hbWUYASABKAlCCvpCB3IFEAEY+gESGgoGc3ltYm9sGAIgASgJQgr6QgdyBRABGPoBEhkKCGRlY2ltYWxzGAMgASgNQgf6QgQqAhgSEhwKCGxvZ29fdXJpGAQgASgJQgr6QgdyBRABGPQDEioKB2FkZHJlc3MYBSABKAlCGfpCFnIUEAEYLDIOXltBLVphLXowLTldKyQicQoZQ3JlYXRlQ3VzdG9tVG9rZW5SZXNwb25zZRIPCgdzdWNjZXNzGAEgASgIEg8KB21lc3NhZ2UYAiABKAkSMgoOdG9rZW5fbWV0YWRhdGEYAyABKAsyGi5kYXJrbGFrZS52MS5Ub2tlbk1ldGFkYXRhIrMBChZFZGl0Q3VzdG9tVG9rZW5SZXF1ZXN0EioKB2FkZHJlc3MYASABKAlCGfpCFnIUEAEYLDIOXltBLVphLXowLTldKyQSGAoEbmFtZRgCIAEoCUIK+kIHcgUQARj6ARIaCgZzeW1ib2wYAyABKAlCCvpCB3IFEAEY+gESGQoIZGVjaW1hbHMYBCABKA1CB/pCBCoCGBISHAoIbG9nb191cmkYBSABKAlCCvpCB3IFEAEY9AMibwoXRWRpdEN1c3RvbVRva2VuUmVzcG9uc2USDwoHc3VjY2VzcxgBIAEoCBIPCgdtZXNzYWdlGAIgASgJEjIKDnRva2VuX21ldGFkYXRhGAMgASgLMhouZGFya2xha2UudjEuVG9rZW5NZXRhZGF0YSJGChhEZWxldGVDdXN0b21Ub2tlblJlcXVlc3QSKgoHYWRkcmVzcxgBIAEoCUIZ+kIWchQQARgsMg5eW0EtWmEtejAtOV0rJCI9ChlEZWxldGVDdXN0b21Ub2tlblJlc3BvbnNlEg8KB3N1Y2Nlc3MYASABKAgSDwoHbWVzc2FnZRgCIAEoCSIYChZHZXRDdXN0b21Ub2tlbnNSZXF1ZXN0IkUKF0dldEN1c3RvbVRva2Vuc1Jlc3BvbnNlEioKBnRva2VucxgBIAMoCzIaLmRhcmtsYWtlLnYxLlRva2VuTWV0YWRhdGEiQwoVR2V0Q3VzdG9tVG9rZW5SZXF1ZXN0EioKB2FkZHJlc3MYASABKAlCGfpCFnIUEAEYLDIOXltBLVphLXowLTldKyQiTAoWR2V0Q3VzdG9tVG9rZW5SZXNwb25zZRIyCg50b2tlbl9tZXRhZGF0YRgBIAEoCzIaLmRhcmtsYWtlLnYxLlRva2VuTWV0YWRhdGEi+wEKD0luaXRQb29sUmVxdWVzdBIvCgx0b2tlbl9taW50X3gYASABKAlCGfpCFnIUEAEYLDIOXltBLVphLXowLTldKyQSLwoMdG9rZW5fbWludF95GAIgASgJQhn6QhZyFBABGCwyDl5bQS1aYS16MC05XSskEi8KDHVzZXJfYWRkcmVzcxgDIAEoCUIZ+kIWchQQARgsMg5eW0EtWmEtejAtOV0rJBIZCghhbW91bnRfeBgEIAEoBEIH+kIEMgIgABIZCghhbW91bnRfeRgFIAEoBEIH+kIEMgIgABIQCghyZWZfY29kZRgGIAEoCRINCgVsYWJlbBgHIAEoCSIwChBJbml0UG9vbFJlc3BvbnNlEhwKFHVuc2lnbmVkX3RyYW5zYWN0aW9uGAEgASgJIqMCChNBZGRMaXF1aWRpdHlSZXF1ZXN0Ei8KDHRva2VuX21pbnRfeBgBIAEoCUIZ+kIWchQQARgsMg5eW0EtWmEtejAtOV0rJBIvCgx0b2tlbl9taW50X3kYAiABKAlCGfpCFnIUEAEYLDIOXltBLVphLXowLTldKyQSLwoMdXNlcl9hZGRyZXNzGAMgASgJQhn6QhZyFBABGCwyDl5bQS1aYS16MC05XSskEhoKCWFtb3VudF9scBgEIAEoBEIH+kIEMgIgABIdCgxtYXhfYW1vdW50X3gYBSABKARCB/pCBDICIAASHQoMbWF4X2Ftb3VudF95GAYgASgEQgf6QgQyAiAAEhAKCHJlZl9jb2RlGAcgASgJEg0KBWxhYmVsGAggASgJIjQKFEFkZExpcXVpZGl0eVJlc3BvbnNlEhwKFHVuc2lnbmVkX3RyYW5zYWN0aW9uGAEgASgJIqYCChZSZW1vdmVMaXF1aWRpdHlSZXF1ZXN0Ei8KDHRva2VuX21pbnRfeBgBIAEoCUIZ+kIWchQQARgsMg5eW0EtWmEtejAtOV0rJBIvCgx0b2tlbl9taW50X3kYAiABKAlCGfpCFnIUEAEYLDIOXltBLVphLXowLTldKyQSLwoMdXNlcl9hZGRyZXNzGAMgASgJQhn6QhZyFBABGCwyDl5bQS1aYS16MC05XSskEhoKCWFtb3VudF9scBgEIAEoBEIH+kIEMgIgABIdCgxtaW5fYW1vdW50X3gYBSABKARCB/pCBDICIAASHQoMbWluX2Ftb3VudF95GAYgASgEQgf6QgQyAiAAEhAKCHJlZl9jb2RlGAcgASgJEg0KBWxhYmVsGAggASgJIjcKF1JlbW92ZUxpcXVpZGl0eVJlc3BvbnNlEhwKFHVuc2lnbmVkX3RyYW5zYWN0aW9uGAEgASgJKjQKB05ldHdvcmsSEAoMTUFJTk5FVF9CRVRBEAASCwoHVEVTVE5FVBABEgoKBkRFVk5FVBACKmsKC1RyYWRlU3RhdHVzEgwKCFVOU0lHTkVEEAASCgoGU0lHTkVEEAESDQoJQ09ORklSTUVEEAISCwoHU0VUVExFRBADEgsKB1NMQVNIRUQQBBINCglDQU5DRUxMRUQQBRIKCgZGQUlMRUQQBjL2CgoUU29sYW5hR2F0ZXdheVNlcnZpY2USegoZQ3JlYXRlVW5zaWduZWRUcmFuc2FjdGlvbhItLmRhcmtsYWtlLnYxLkNyZWF0ZVVuc2lnbmVkVHJhbnNhY3Rpb25SZXF1ZXN0Gi4uZGFya2xha2UudjEuQ3JlYXRlVW5zaWduZWRUcmFuc2FjdGlvblJlc3BvbnNlEm4KFVNlbmRTaWduZWRUcmFuc2FjdGlvbhIpLmRhcmtsYWtlLnYxLlNlbmRTaWduZWRUcmFuc2FjdGlvblJlcXVlc3QaKi5kYXJrbGFrZS52MS5TZW5kU2lnbmVkVHJhbnNhY3Rpb25SZXNwb25zZRJfChBDaGVja1RyYWRlU3RhdHVzEiQuZGFya2xha2UudjEuQ2hlY2tUcmFkZVN0YXR1c1JlcXVlc3QaJS5kYXJrbGFrZS52MS5DaGVja1RyYWRlU3RhdHVzUmVzcG9uc2USaAoTR2V0VHJhZGVzTGlzdEJ5VXNlchInLmRhcmtsYWtlLnYxLkdldFRyYWRlc0xpc3RCeVVzZXJSZXF1ZXN0GiguZGFya2xha2UudjEuR2V0VHJhZGVzTGlzdEJ5VXNlclJlc3BvbnNlEl8KEEdldFRva2VuTWV0YWRhdGESJC5kYXJrbGFrZS52MS5HZXRUb2tlbk1ldGFkYXRhUmVxdWVzdBolLmRhcmtsYWtlLnYxLkdldFRva2VuTWV0YWRhdGFSZXNwb25zZRJrChRHZXRUb2tlbk1ldGFkYXRhTGlzdBIoLmRhcmtsYWtlLnYxLkdldFRva2VuTWV0YWRhdGFMaXN0UmVxdWVzdBopLmRhcmtsYWtlLnYxLkdldFRva2VuTWV0YWRhdGFMaXN0UmVzcG9uc2USYgoRQ3JlYXRlQ3VzdG9tVG9rZW4SJS5kYXJrbGFrZS52MS5DcmVhdGVDdXN0b21Ub2tlblJlcXVlc3QaJi5kYXJrbGFrZS52MS5DcmVhdGVDdXN0b21Ub2tlblJlc3BvbnNlElwKD0VkaXRDdXN0b21Ub2tlbhIjLmRhcmtsYWtlLnYxLkVkaXRDdXN0b21Ub2tlblJlcXVlc3QaJC5kYXJrbGFrZS52MS5FZGl0Q3VzdG9tVG9rZW5SZXNwb25zZRJiChFEZWxldGVDdXN0b21Ub2tlbhIlLmRhcmtsYWtlLnYxLkRlbGV0ZUN1c3RvbVRva2VuUmVxdWVzdBomLmRhcmtsYWtlLnYxLkRlbGV0ZUN1c3RvbVRva2VuUmVzcG9uc2USXAoPR2V0Q3VzdG9tVG9rZW5zEiMuZGFya2xha2UudjEuR2V0Q3VzdG9tVG9rZW5zUmVxdWVzdBokLmRhcmtsYWtlLnYxLkdldEN1c3RvbVRva2Vuc1Jlc3BvbnNlElkKDkdldEN1c3RvbVRva2VuEiIuZGFya2xha2UudjEuR2V0Q3VzdG9tVG9rZW5SZXF1ZXN0GiMuZGFya2xha2UudjEuR2V0Q3VzdG9tVG9rZW5SZXNwb25zZRJHCghJbml0UG9vbBIcLmRhcmtsYWtlLnYxLkluaXRQb29sUmVxdWVzdBodLmRhcmtsYWtlLnYxLkluaXRQb29sUmVzcG9uc2USUwoMQWRkTGlxdWlkaXR5EiAuZGFya2xha2UudjEuQWRkTGlxdWlkaXR5UmVxdWVzdBohLmRhcmtsYWtlLnYxLkFkZExpcXVpZGl0eVJlc3BvbnNlElwKD1JlbW92ZUxpcXVpZGl0eRIjLmRhcmtsYWtlLnYxLlJlbW92ZUxpcXVpZGl0eVJlcXVlc3QaJC5kYXJrbGFrZS52MS5SZW1vdmVMaXF1aWRpdHlSZXNwb25zZTKQBgobRGFya2xha2VJbnRlZ3JhdGlvbnNTZXJ2aWNlEj4KBVF1b3RlEhkuZGFya2xha2UudjEuUXVvdGVSZXF1ZXN0GhouZGFya2xha2UudjEuUXVvdGVSZXNwb25zZRJ6ChlDcmVhdGVVbnNpZ25lZFRyYW5zYWN0aW9uEi0uZGFya2xha2UudjEuQ3JlYXRlVW5zaWduZWRUcmFuc2FjdGlvblJlcXVlc3QaLi5kYXJrbGFrZS52MS5DcmVhdGVVbnNpZ25lZFRyYW5zYWN0aW9uUmVzcG9uc2USbgoVU2VuZFNpZ25lZFRyYW5zYWN0aW9uEikuZGFya2xha2UudjEuU2VuZFNpZ25lZFRyYW5zYWN0aW9uUmVxdWVzdBoqLmRhcmtsYWtlLnYxLlNlbmRTaWduZWRUcmFuc2FjdGlvblJlc3BvbnNlEl8KEENoZWNrVHJhZGVTdGF0dXMSJC5kYXJrbGFrZS52MS5DaGVja1RyYWRlU3RhdHVzUmVxdWVzdBolLmRhcmtsYWtlLnYxLkNoZWNrVHJhZGVTdGF0dXNSZXNwb25zZRJoChNHZXRUcmFkZXNMaXN0QnlVc2VyEicuZGFya2xha2UudjEuR2V0VHJhZGVzTGlzdEJ5VXNlclJlcXVlc3QaKC5kYXJrbGFrZS52MS5HZXRUcmFkZXNMaXN0QnlVc2VyUmVzcG9uc2USRwoISW5pdFBvb2wSHC5kYXJrbGFrZS52MS5Jbml0UG9vbFJlcXVlc3QaHS5kYXJrbGFrZS52MS5Jbml0UG9vbFJlc3BvbnNlElMKDEFkZExpcXVpZGl0eRIgLmRhcmtsYWtlLnYxLkFkZExpcXVpZGl0eVJlcXVlc3QaIS5kYXJrbGFrZS52MS5BZGRMaXF1aWRpdHlSZXNwb25zZRJcCg9SZW1vdmVMaXF1aWRpdHkSIy5kYXJrbGFrZS52MS5SZW1vdmVMaXF1aWRpdHlSZXF1ZXN0GiQuZGFya2xha2UudjEuUmVtb3ZlTGlxdWlkaXR5UmVzcG9uc2ViBnByb3RvMw",
  [file_validate_validate],
);
export type TokenMetadata = Message<"darklake.v1.TokenMetadata"> & {
  name: string;
  symbol: string;
  decimals: number;
  logoUri: string;
  address: string;
};
export const TokenMetadataSchema: GenMessage<TokenMetadata> = messageDesc(
  file_api,
  0,
);
export type Trade = Message<"darklake.v1.Trade"> & {
  tradeId: string;
  orderId: string;
  userAddress: string;
  tokenX?: TokenMetadata;
  tokenY?: TokenMetadata;
  amountIn: bigint;
  minimalAmountOut: bigint;
  status: TradeStatus;
  signature: string;
  createdAt: bigint;
  updatedAt: bigint;
  isSwapXToY: boolean;
};
export const TradeSchema: GenMessage<Trade> = messageDesc(file_api, 1);
export type QuoteRequest = Message<"darklake.v1.QuoteRequest"> & {
  tokenMintX: string;
  tokenMintY: string;
  amountIn: bigint;
  isSwapXToY: boolean;
};
export const QuoteRequestSchema: GenMessage<QuoteRequest> = messageDesc(
  file_api,
  2,
);
export type QuoteResponse = Message<"darklake.v1.QuoteResponse"> & {
  tokenMintX: string;
  tokenMintY: string;
  isSwapXToY: boolean;
  amountIn: bigint;
  amountOut: bigint;
  feeAmount: bigint;
  feePct: number;
};
export const QuoteResponseSchema: GenMessage<QuoteResponse> = messageDesc(
  file_api,
  3,
);
export type CreateUnsignedTransactionRequest =
  Message<"darklake.v1.CreateUnsignedTransactionRequest"> & {
    userAddress: string;
    tokenMintX: string;
    tokenMintY: string;
    amountIn: bigint;
    minOut: bigint;
    trackingId: string;
    isSwapXToY: boolean;
    refCode: string;
    label: string;
  };
export const CreateUnsignedTransactionRequestSchema: GenMessage<CreateUnsignedTransactionRequest> =
  messageDesc(file_api, 4);
export type CreateUnsignedTransactionResponse =
  Message<"darklake.v1.CreateUnsignedTransactionResponse"> & {
    unsignedTransaction: string;
    orderId: string;
    tradeId: string;
    refCode: string;
  };
export const CreateUnsignedTransactionResponseSchema: GenMessage<CreateUnsignedTransactionResponse> =
  messageDesc(file_api, 5);
export type SendSignedTransactionRequest =
  Message<"darklake.v1.SendSignedTransactionRequest"> & {
    signedTransaction: string;
    trackingId: string;
    tradeId: string;
  };
export const SendSignedTransactionRequestSchema: GenMessage<SendSignedTransactionRequest> =
  messageDesc(file_api, 6);
export type SendSignedTransactionResponse =
  Message<"darklake.v1.SendSignedTransactionResponse"> & {
    success: boolean;
    tradeId: string;
    errorLogs: string[];
  };
export const SendSignedTransactionResponseSchema: GenMessage<SendSignedTransactionResponse> =
  messageDesc(file_api, 7);
export type CheckTradeStatusRequest =
  Message<"darklake.v1.CheckTradeStatusRequest"> & {
    trackingId: string;
    tradeId: string;
  };
export const CheckTradeStatusRequestSchema: GenMessage<CheckTradeStatusRequest> =
  messageDesc(file_api, 8);
export type CheckTradeStatusResponse =
  Message<"darklake.v1.CheckTradeStatusResponse"> & {
    tradeId: string;
    status: TradeStatus;
  };
export const CheckTradeStatusResponseSchema: GenMessage<CheckTradeStatusResponse> =
  messageDesc(file_api, 9);
export type GetTradesListByUserRequest =
  Message<"darklake.v1.GetTradesListByUserRequest"> & {
    userAddress: string;
    pageSize: number;
    pageNumber: number;
  };
export const GetTradesListByUserRequestSchema: GenMessage<GetTradesListByUserRequest> =
  messageDesc(file_api, 10);
export type GetTradesListByUserResponse =
  Message<"darklake.v1.GetTradesListByUserResponse"> & {
    trades: Trade[];
    totalPages: number;
    currentPage: number;
  };
export const GetTradesListByUserResponseSchema: GenMessage<GetTradesListByUserResponse> =
  messageDesc(file_api, 11);
export type GetTokenMetadataRequest =
  Message<"darklake.v1.GetTokenMetadataRequest"> & {
    searchBy:
      | {
          value: string;
          case: "tokenAddress";
        }
      | {
          value: string;
          case: "tokenSymbol";
        }
      | {
          value: string;
          case: "tokenName";
        }
      | {
          value: string;
          case: "substring";
        }
      | { case: undefined; value?: undefined };
  };
export const GetTokenMetadataRequestSchema: GenMessage<GetTokenMetadataRequest> =
  messageDesc(file_api, 12);
export type GetTokenMetadataResponse =
  Message<"darklake.v1.GetTokenMetadataResponse"> & {
    tokenMetadata?: TokenMetadata;
  };
export const GetTokenMetadataResponseSchema: GenMessage<GetTokenMetadataResponse> =
  messageDesc(file_api, 13);
export type TokenAddressesList = Message<"darklake.v1.TokenAddressesList"> & {
  tokenAddresses: string[];
};
export const TokenAddressesListSchema: GenMessage<TokenAddressesList> =
  messageDesc(file_api, 14);
export type TokenSymbolsList = Message<"darklake.v1.TokenSymbolsList"> & {
  tokenSymbols: string[];
};
export const TokenSymbolsListSchema: GenMessage<TokenSymbolsList> = messageDesc(
  file_api,
  15,
);
export type TokenNamesList = Message<"darklake.v1.TokenNamesList"> & {
  tokenNames: string[];
};
export const TokenNamesListSchema: GenMessage<TokenNamesList> = messageDesc(
  file_api,
  16,
);
export type GetTokenMetadataListRequest =
  Message<"darklake.v1.GetTokenMetadataListRequest"> & {
    filterBy:
      | {
          value: TokenAddressesList;
          case: "addressesList";
        }
      | {
          value: TokenSymbolsList;
          case: "symbolsList";
        }
      | {
          value: TokenNamesList;
          case: "namesList";
        }
      | {
          value: string;
          case: "substring";
        }
      | { case: undefined; value?: undefined };
    pageSize: number;
    pageNumber: number;
  };
export const GetTokenMetadataListRequestSchema: GenMessage<GetTokenMetadataListRequest> =
  messageDesc(file_api, 17);
export type GetTokenMetadataListResponse =
  Message<"darklake.v1.GetTokenMetadataListResponse"> & {
    tokens: TokenMetadata[];
    totalPages: number;
    currentPage: number;
  };
export const GetTokenMetadataListResponseSchema: GenMessage<GetTokenMetadataListResponse> =
  messageDesc(file_api, 18);
export type CreateCustomTokenRequest =
  Message<"darklake.v1.CreateCustomTokenRequest"> & {
    name: string;
    symbol: string;
    decimals: number;
    logoUri: string;
    address: string;
  };
export const CreateCustomTokenRequestSchema: GenMessage<CreateCustomTokenRequest> =
  messageDesc(file_api, 19);
export type CreateCustomTokenResponse =
  Message<"darklake.v1.CreateCustomTokenResponse"> & {
    success: boolean;
    message: string;
    tokenMetadata?: TokenMetadata;
  };
export const CreateCustomTokenResponseSchema: GenMessage<CreateCustomTokenResponse> =
  messageDesc(file_api, 20);
export type EditCustomTokenRequest =
  Message<"darklake.v1.EditCustomTokenRequest"> & {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    logoUri: string;
  };
export const EditCustomTokenRequestSchema: GenMessage<EditCustomTokenRequest> =
  messageDesc(file_api, 21);
export type EditCustomTokenResponse =
  Message<"darklake.v1.EditCustomTokenResponse"> & {
    success: boolean;
    message: string;
    tokenMetadata?: TokenMetadata;
  };
export const EditCustomTokenResponseSchema: GenMessage<EditCustomTokenResponse> =
  messageDesc(file_api, 22);
export type DeleteCustomTokenRequest =
  Message<"darklake.v1.DeleteCustomTokenRequest"> & {
    address: string;
  };
export const DeleteCustomTokenRequestSchema: GenMessage<DeleteCustomTokenRequest> =
  messageDesc(file_api, 23);
export type DeleteCustomTokenResponse =
  Message<"darklake.v1.DeleteCustomTokenResponse"> & {
    success: boolean;
    message: string;
  };
export const DeleteCustomTokenResponseSchema: GenMessage<DeleteCustomTokenResponse> =
  messageDesc(file_api, 24);
export type GetCustomTokensRequest =
  Message<"darklake.v1.GetCustomTokensRequest"> & {};
export const GetCustomTokensRequestSchema: GenMessage<GetCustomTokensRequest> =
  messageDesc(file_api, 25);
export type GetCustomTokensResponse =
  Message<"darklake.v1.GetCustomTokensResponse"> & {
    tokens: TokenMetadata[];
  };
export const GetCustomTokensResponseSchema: GenMessage<GetCustomTokensResponse> =
  messageDesc(file_api, 26);
export type GetCustomTokenRequest =
  Message<"darklake.v1.GetCustomTokenRequest"> & {
    address: string;
  };
export const GetCustomTokenRequestSchema: GenMessage<GetCustomTokenRequest> =
  messageDesc(file_api, 27);
export type GetCustomTokenResponse =
  Message<"darklake.v1.GetCustomTokenResponse"> & {
    tokenMetadata?: TokenMetadata;
  };
export const GetCustomTokenResponseSchema: GenMessage<GetCustomTokenResponse> =
  messageDesc(file_api, 28);
export type InitPoolRequest = Message<"darklake.v1.InitPoolRequest"> & {
  tokenMintX: string;
  tokenMintY: string;
  userAddress: string;
  amountX: bigint;
  amountY: bigint;
  refCode: string;
  label: string;
};
export const InitPoolRequestSchema: GenMessage<InitPoolRequest> = messageDesc(
  file_api,
  29,
);
export type InitPoolResponse = Message<"darklake.v1.InitPoolResponse"> & {
  unsignedTransaction: string;
};
export const InitPoolResponseSchema: GenMessage<InitPoolResponse> = messageDesc(
  file_api,
  30,
);
export type AddLiquidityRequest = Message<"darklake.v1.AddLiquidityRequest"> & {
  tokenMintX: string;
  tokenMintY: string;
  userAddress: string;
  amountLp: bigint;
  maxAmountX: bigint;
  maxAmountY: bigint;
  refCode: string;
  label: string;
};
export const AddLiquidityRequestSchema: GenMessage<AddLiquidityRequest> =
  messageDesc(file_api, 31);
export type AddLiquidityResponse =
  Message<"darklake.v1.AddLiquidityResponse"> & {
    unsignedTransaction: string;
  };
export const AddLiquidityResponseSchema: GenMessage<AddLiquidityResponse> =
  messageDesc(file_api, 32);
export type RemoveLiquidityRequest =
  Message<"darklake.v1.RemoveLiquidityRequest"> & {
    tokenMintX: string;
    tokenMintY: string;
    userAddress: string;
    amountLp: bigint;
    minAmountX: bigint;
    minAmountY: bigint;
    refCode: string;
    label: string;
  };
export const RemoveLiquidityRequestSchema: GenMessage<RemoveLiquidityRequest> =
  messageDesc(file_api, 33);
export type RemoveLiquidityResponse =
  Message<"darklake.v1.RemoveLiquidityResponse"> & {
    unsignedTransaction: string;
  };
export const RemoveLiquidityResponseSchema: GenMessage<RemoveLiquidityResponse> =
  messageDesc(file_api, 34);
export enum Network {
  MAINNET_BETA = 0,
  TESTNET = 1,
  DEVNET = 2,
}
export const NetworkSchema: GenEnum<Network> = enumDesc(file_api, 0);
export enum TradeStatus {
  UNSIGNED = 0,
  SIGNED = 1,
  CONFIRMED = 2,
  SETTLED = 3,
  SLASHED = 4,
  CANCELLED = 5,
  FAILED = 6,
}
export const TradeStatusSchema: GenEnum<TradeStatus> = enumDesc(file_api, 1);
export const SolanaGatewayService: GenService<{
  createUnsignedTransaction: {
    methodKind: "unary";
    input: typeof CreateUnsignedTransactionRequestSchema;
    output: typeof CreateUnsignedTransactionResponseSchema;
  };
  sendSignedTransaction: {
    methodKind: "unary";
    input: typeof SendSignedTransactionRequestSchema;
    output: typeof SendSignedTransactionResponseSchema;
  };
  checkTradeStatus: {
    methodKind: "unary";
    input: typeof CheckTradeStatusRequestSchema;
    output: typeof CheckTradeStatusResponseSchema;
  };
  getTradesListByUser: {
    methodKind: "unary";
    input: typeof GetTradesListByUserRequestSchema;
    output: typeof GetTradesListByUserResponseSchema;
  };
  getTokenMetadata: {
    methodKind: "unary";
    input: typeof GetTokenMetadataRequestSchema;
    output: typeof GetTokenMetadataResponseSchema;
  };
  getTokenMetadataList: {
    methodKind: "unary";
    input: typeof GetTokenMetadataListRequestSchema;
    output: typeof GetTokenMetadataListResponseSchema;
  };
  createCustomToken: {
    methodKind: "unary";
    input: typeof CreateCustomTokenRequestSchema;
    output: typeof CreateCustomTokenResponseSchema;
  };
  editCustomToken: {
    methodKind: "unary";
    input: typeof EditCustomTokenRequestSchema;
    output: typeof EditCustomTokenResponseSchema;
  };
  deleteCustomToken: {
    methodKind: "unary";
    input: typeof DeleteCustomTokenRequestSchema;
    output: typeof DeleteCustomTokenResponseSchema;
  };
  getCustomTokens: {
    methodKind: "unary";
    input: typeof GetCustomTokensRequestSchema;
    output: typeof GetCustomTokensResponseSchema;
  };
  getCustomToken: {
    methodKind: "unary";
    input: typeof GetCustomTokenRequestSchema;
    output: typeof GetCustomTokenResponseSchema;
  };
  initPool: {
    methodKind: "unary";
    input: typeof InitPoolRequestSchema;
    output: typeof InitPoolResponseSchema;
  };
  addLiquidity: {
    methodKind: "unary";
    input: typeof AddLiquidityRequestSchema;
    output: typeof AddLiquidityResponseSchema;
  };
  removeLiquidity: {
    methodKind: "unary";
    input: typeof RemoveLiquidityRequestSchema;
    output: typeof RemoveLiquidityResponseSchema;
  };
}> = serviceDesc(file_api, 0);
export const DarklakeIntegrationsService: GenService<{
  quote: {
    methodKind: "unary";
    input: typeof QuoteRequestSchema;
    output: typeof QuoteResponseSchema;
  };
  createUnsignedTransaction: {
    methodKind: "unary";
    input: typeof CreateUnsignedTransactionRequestSchema;
    output: typeof CreateUnsignedTransactionResponseSchema;
  };
  sendSignedTransaction: {
    methodKind: "unary";
    input: typeof SendSignedTransactionRequestSchema;
    output: typeof SendSignedTransactionResponseSchema;
  };
  checkTradeStatus: {
    methodKind: "unary";
    input: typeof CheckTradeStatusRequestSchema;
    output: typeof CheckTradeStatusResponseSchema;
  };
  getTradesListByUser: {
    methodKind: "unary";
    input: typeof GetTradesListByUserRequestSchema;
    output: typeof GetTradesListByUserResponseSchema;
  };
  initPool: {
    methodKind: "unary";
    input: typeof InitPoolRequestSchema;
    output: typeof InitPoolResponseSchema;
  };
  addLiquidity: {
    methodKind: "unary";
    input: typeof AddLiquidityRequestSchema;
    output: typeof AddLiquidityResponseSchema;
  };
  removeLiquidity: {
    methodKind: "unary";
    input: typeof RemoveLiquidityRequestSchema;
    output: typeof RemoveLiquidityResponseSchema;
  };
}> = serviceDesc(file_api, 1);
